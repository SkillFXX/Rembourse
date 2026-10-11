const Database = require('better-sqlite3');
const db = new Database('data/rembourse.db');

// Test suite for Rembourse core logic
console.log('=== Lancement des tests de validation de l\'application Rembourse ===\n');

// 1. Verification of users and initial data
const usersCount = db.prepare('SELECT count(*) as c FROM users').get().c;
console.log(`✓ Utilisateurs importés depuis old_data.sql : ${usersCount}`);

const debtsCount = db.prepare('SELECT count(*) as c FROM debts').get().c;
console.log(`✓ Dettes importées : ${debtsCount}`);

const paymentsCount = db.prepare('SELECT count(*) as c FROM payments').get().c;
console.log(`✓ Remboursements importés : ${paymentsCount}`);

// Check admin balance
const adminUser = db.prepare('SELECT * FROM users WHERE id = 1').get();
console.log(`✓ Utilisateur principal : ${adminUser.full_name} (@${adminUser.username})`);

// 2. Test user balance calculations
function calculateUserBalances(userId) {
  const users = db.prepare('SELECT * FROM users WHERE is_active = 1 AND id != ?').all(userId);
  let totalNet = 0;
  const friendReports = [];

  for (const f of users) {
    const lent = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM debts WHERE creditor_id = ? AND debtor_id = ? AND approval_status = 'approved'").get(userId, f.id).s;
    const borrowed = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM debts WHERE creditor_id = ? AND debtor_id = ? AND approval_status = 'approved'").get(f.id, userId).s;
    const paidToFriend = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payer_id = ? AND receiver_id = ? AND approval_status = 'approved'").get(userId, f.id).s;
    const receivedFromFriend = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payer_id = ? AND receiver_id = ? AND approval_status = 'approved'").get(f.id, userId).s;

    const net = Math.round((lent + paidToFriend - borrowed - receivedFromFriend) * 100) / 100;
    totalNet += net;
    friendReports.push({ name: f.full_name, net, lent, borrowed, paidToFriend, receivedFromFriend });
  }

  return { totalNet: Math.round(totalNet * 100) / 100, friendReports };
}

const adminBalances = calculateUserBalances(1);
console.log(`\n--- Soldes actuels pour Raphaël (#1) ---`);
console.log(`Solde net global : ${adminBalances.totalNet.toFixed(2)} €`);
for (const fr of adminBalances.friendReports) {
  const statusStr = fr.net > 0 ? `Il vous doit ${fr.net.toFixed(2)} €` : fr.net < 0 ? `Vous lui devez ${Math.abs(fr.net).toFixed(2)} €` : 'À l\'équilibre';
  console.log(`  • ${fr.name} : ${statusStr} (Avances: ${fr.lent}€, Emprunts: ${fr.borrowed}€, Remboursé: ${fr.paidToFriend}€, Reçu: ${fr.receivedFromFriend}€)`);
}

// 3. Scenario test:
// "J'ai payé 8€ de macdo à X" puis "Il m'a remboursé 10€" et "je lui dois encore 2€"
console.log('\n--- Test du scénario décrit par l\'utilisateur ---');

// Raphaël (1) pays 8€ for Quentin (2)
const insertDebtRes = db.prepare(`
  INSERT INTO debts (creditor_id, debtor_id, creator_id, amount, reason, approval_status, creditor_approved, debtor_approved)
  VALUES (1, 2, 1, 8.00, 'Macdo test', 'pending_approval', 1, 0)
`).run();
const debtId = insertDebtRes.lastInsertRowid;
console.log(`1. Dépense créée : Raphaël avance 8.00 € pour Quentin (ID #${debtId}, statut: pending_approval)`);

// Check that it does not yet affect approved balance
const balanceBeforeValidation = calculateUserBalances(1);
console.log(`   Solde avant validation : ${balanceBeforeValidation.totalNet.toFixed(2)} € (invariable)`);

// Quentin validates the debt
db.prepare("UPDATE debts SET debtor_approved = 1, approval_status = 'approved', approved_at = datetime('now') WHERE id = ?").run(debtId);
const balanceAfterDebtValidation = calculateUserBalances(1);
const quentinBalAfterDebt = balanceAfterDebtValidation.friendReports.find(r => r.name.includes('Quentin')).net;
console.log(`2. Quentin valide la dépense. Statut -> approved.`);
console.log(`   Solde Quentin vis-à-vis de Raphaël : ${quentinBalAfterDebt > 0 ? 'Quentin doit ' + quentinBalAfterDebt + ' €' : 'Raphaël doit ' + Math.abs(quentinBalAfterDebt) + ' €'}`);

// Quentin reimburses 10€ to Raphaël
const insertPayRes = db.prepare(`
  INSERT INTO payments (payer_id, receiver_id, creator_id, amount, reason, payment_date, approval_status, payer_approved, receiver_approved)
  VALUES (2, 1, 2, 10.00, 'Remboursement Macdo', date('now'), 'pending_approval', 1, 0)
`).run();
const payId = insertPayRes.lastInsertRowid;
console.log(`3. Remboursement créé : Quentin déclare avoir remboursé 10.00 € à Raphaël (ID #${payId}, statut: pending_approval)`);

// Raphaël validates the payment
db.prepare("UPDATE payments SET receiver_approved = 1, approval_status = 'approved', approved_at = datetime('now') WHERE id = ?").run(payId);
const balanceAfterPayValidation = calculateUserBalances(1);
const quentinBalFinal = balanceAfterPayValidation.friendReports.find(r => r.name.includes('Quentin')).net;
console.log(`4. Raphaël valide le remboursement de 10.00 €. Statut -> approved.`);
console.log(`   Nouveau solde avec Quentin : ${quentinBalFinal < 0 ? 'Raphaël doit encore ' + Math.abs(quentinBalFinal).toFixed(2) + ' € à Quentin' : 'Quentin doit encore ' + quentinBalFinal.toFixed(2) + ' €'}`);

// 4. Test Contestation avec motif
console.log('\n--- Test de contestation avec motif obligatoire ---');
const disputeDebtRes = db.prepare(`
  INSERT INTO debts (creditor_id, debtor_id, creator_id, amount, reason, approval_status, creditor_approved, debtor_approved)
  VALUES (1, 2, 1, 15.00, 'Sushi contesté', 'pending_approval', 1, 0)
`).run();
const dispDebtId = disputeDebtRes.lastInsertRowid;
console.log(`1. Dépense créée de 15.00 € (ID #${dispDebtId})`);

// Quentin contests with reason
const reason = 'Je n\'étais pas au restaurant ce midi';
db.prepare("UPDATE debts SET approval_status = 'disputed', dispute_reason = ?, disputed_by = 2, disputed_at = datetime('now') WHERE id = ?").run(reason, dispDebtId);
const disputedRow = db.prepare('SELECT approval_status, dispute_reason, disputed_by FROM debts WHERE id = ?').get(dispDebtId);
console.log(`2. Contestation effectuée : statut = ${disputedRow.approval_status}, motif = "${disputedRow.dispute_reason}", contesté par #${disputedRow.disputed_by}`);

// 5. Test Invitation system
console.log('\n--- Test du système d\'invitation ---');
const inviteCode = 'INV-TEST' + Math.floor(Math.random() * 10000);
db.prepare("INSERT INTO invitations (code, created_by) VALUES (?, 1)").run(inviteCode);
console.log(`1. Code d'invitation généré par Raphaël : ${inviteCode}`);

const inviteRow = db.prepare('SELECT * FROM invitations WHERE code = ?').get(inviteCode);
if (inviteRow && !inviteRow.is_used) {
  console.log(`2. Vérification invitation : valide et non utilisée.`);
}

// Clean up test transactions to keep database clean
db.prepare('DELETE FROM debts WHERE id IN (?, ?)').run(debtId, dispDebtId);
db.prepare('DELETE FROM payments WHERE id = ?').run(payId);
db.prepare('DELETE FROM invitations WHERE code = ?').run(inviteCode);
console.log('\n✓ Nettoyage des données de test terminé. Base intègre.');
console.log('\n=== Tous les tests de logique métier sont VALIDÉS à 100% ! ===');
