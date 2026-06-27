// =================================================================
//  setup-claims.js — Setar tenantId + role nos usuários do Firebase Auth.
// -----------------------------------------------------------------
//  Execute ANTES de fazer o deploy das novas firestore.rules.
//  Sem isso, ninguém entra no painel (rules exigem o claim).
//
//  Como rodar (local, uma vez):
//      1) npm i firebase-admin
//      2) Baixar a service-account-key.json no Console Firebase:
//         Project Settings > Service accounts > Generate new private key
//         Salvar como serviceAccountKey.json AO LADO deste script.
//         IMPORTANTE: adicione serviceAccountKey.json no .gitignore.
//      3) Ajustar USERS abaixo conforme sua realidade.
//      4) node scripts/setup-claims.js
//
//  Idempotente: rodar de novo só sobrescreve o claim.
// =================================================================

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Edite esta lista com os emails atuais e o papel de cada um.
// roles válidos: 'owner' | 'manager' | 'cashier'
const USERS = [
    { email: 'dono@bravaconveniencia.com.br', tenantId: 'loja-padrao', role: 'owner' },
    // { email: 'gerente@bravaconveniencia.com.br', tenantId: 'loja-padrao', role: 'manager' },
    // { email: 'caixa1@bravaconveniencia.com.br', tenantId: 'loja-padrao', role: 'cashier' },
];

(async () => {
    for (const u of USERS) {
        try {
            const user = await admin.auth().getUserByEmail(u.email);
            await admin.auth().setCustomUserClaims(user.uid, {
                tenantId: u.tenantId,
                role: u.role
            });
            // Forçar refresh do token na próxima requisição (revoga sessão atual).
            await admin.auth().revokeRefreshTokens(user.uid);
            console.log(`OK  ${u.email}  ->  tenant=${u.tenantId} role=${u.role}`);
        } catch (e) {
            console.error(`ERR ${u.email}: ${e.message}`);
        }
    }
    process.exit(0);
})();
