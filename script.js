// ==========================================================================
// 0. CONFIGURATION BASE DE DONNÉES (NOUVEAU)
// ==========================================================================
const SB_URL = "https://rayyxgqgiwjytesoykgd.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXl4Z3FnaXdqeXRlc295a2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgxMTQsImV4cCI6MjA4NjQwNDExNH0.KTGP8Kj9ueLBzasriq4sHJyNDK6nSryvZjc6NCsWRSM";

// Initialisation corrigée : on utilise 'supabase' directement
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);
// ==========================================================================
// 1. ÉTAT GLOBAL ET CONFIGURATION
// ==========================================================================

window.configExpertise = JSON.parse(localStorage.getItem('ox_config')) || {};
window.savedDeals = JSON.parse(localStorage.getItem('ox_history')) || [];
window.expenses = JSON.parse(localStorage.getItem('ox_expenses')) || [];
window.contacts = JSON.parse(localStorage.getItem('ox_contacts')) || [];
window.checks = {}; // État temporaire de la checklist en cours

const inspectionConfig = [

    { name: "Carte Grise", defVal: 0, defType: "price", cat: "Admin" },
    { name: "Contrôle Technique", defVal: 120, defType: "price", cat: "Admin" },
    { name: "Histovec", defVal: 15, defType: "points", cat: "Admin" },
    { name: "Non-gage", defVal: 10, defType: "points", cat: "Admin" },
    { name: "Factures d'entretien", defVal: 20, defType: "points", cat: "Admin" },
    { name: "Alignement carrosserie", defVal: 400, defType: "price", cat: "Ext" },
    { name: "État peinture", defVal: 300, defType: "price", cat: "Ext" },
    { name: "Pneus & Freins", defVal: 250, defType: "price", cat: "Ext" },
    { name: "Optiques/Phares", defVal: 150, defType: "price", cat: "Ext" },
    { name: "Jantes/Rayures", defVal: 200, defType: "price", cat: "Ext" },
    { name: "Niveau Huile", defVal: 100, defType: "price", cat: "Meca" },
    { name: "Bruit Turbo", defVal: 1200, defType: "price", cat: "Meca" },
    { name: "Embrayage", defVal: 800, defType: "price", cat: "Meca" },
    { name: "Courroie (date)", defVal: 600, defType: "price", cat: "Meca" },
    { name: "Joint de culasse", defVal: 1500, defType: "price", cat: "Meca" },
    { name: "Fuites moteur", defVal: 400, defType: "price", cat: "Meca" },
    { name: "Climatisation", defVal: 500, defType: "price", cat: "Int" },
    { name: "État sièges/volant", defVal: 250, defType: "price", cat: "Int" },
    { name: "Voyants tableau bord", defVal: 40, defType: "points", cat: "Int" },
    { name: "Électronique/GPS", defVal: 400, defType: "price", cat: "Int" },
    { name: "Démarrage à froid", defVal: 200, defType: "price", cat: "Essai" },
    { name: "Passage des vitesses", defVal: 1000, defType: "price", cat: "Essai" },
    { name: "Fumées échappement", defVal: 30, defType: "points", cat: "Essai" },
    { name: "Bruit roulement", defVal: 150, defType: "price", cat: "Essai" },
    { name: "Précision direction", defVal: 350, defType: "price", cat: "Essai" },
    { name: "Freinage urgence", defVal: 20, defType: "points", cat: "Essai" },
    { name: "Ralenti stable", defVal: 15, defType: "points", cat: "Essai" }
];

// Initialisation auto des prix si non définis
inspectionConfig.forEach(pt => {
    if (!window.configExpertise[pt.name]) {
        window.configExpertise[pt.name] = { val: pt.defVal, type: pt.defType };
    }
});



// ==========================================================================
// 2. MODULE NAVIGATION
// ==========================================================================
window.switchTab = function(id, btn) {
    // 1. Cacher toutes les vues
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    // 2. Afficher la vue cible
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // 3. Gérer l'état visuel des boutons de navigation
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // 4. Rafraîchissement intelligent
    switch(id) {
        case 'pilotage':
            // --- AJOUT SEUL ---
            if (window.updateDashboard) window.updateDashboard();
            // ------------------
            window.updatePilotage();
            break;
        case 'analyse':
            break;
        case 'expertise':
            if (window.renderExpertise) window.renderExpertise();
            if (window.runCalculations) window.runCalculations();
            break;
        case 'inventaire':
            window.renderInventory();
            break;
        case 'maintenance':
        case 'logistique':
            window.renderMaintenance();
            // --- AJOUT SEUL ---
            if (window.updateDashboard) window.updateDashboard();
            // ------------------
            break;
        case 'finance':
            if (window.updateFinance) window.updateFinance();
            else if (window.updateFinanceUI) window.updateFinanceUI();
            break;
        case 'crm':
            window.renderCRM();
            break;
        case 'admin':
            if (window.updateAdmin) window.updateAdmin();
            break;
        case 'dashboard':
            if (window.updateHistory) window.updateHistory();
            break;
        case 'options':
            window.renderConfigEditor();
            break;
        case 'profil':
            break;
        case 'annonce':
            if (window.loadAdVehicles) window.loadAdVehicles();
            break;
    }

    // --- MISE À JOUR BARRE IA ---
    const iaBar = document.getElementById('ia-bar');
    if (iaBar) {
        const showOn = ['analyse', 'expertise', 'nego'];
        if (showOn.includes(id)) {
            iaBar.style.display = 'flex';
            if (window.runCalculations) window.runCalculations();
        } else {
            iaBar.style.display = 'none';
        }
    }

    if (window.lucide) lucide.createIcons();
};

// --- 1. DÉCLARATION PRIORITAIRE (EN HAUT DU FICHIER) ---
window.saveProfile = function() {
    console.log("Bouton cliqué");
    
    // On récupère les éléments
    const getVal = (id) => document.getElementById(id)?.value || "";
    
    const data = {
        companyName: getVal('biz-name'),
        siret: getVal('biz-siret'),
        tvaIntra: getVal('biz-tva'),
        phone: getVal('biz-phone'),
        web: getVal('biz-web'),
        address: getVal('biz-address'),
        footer: getVal('biz-footer'),
        logo: document.getElementById('user-logo-preview')?.src || ""
    };

    localStorage.setItem('ox_profile_settings', JSON.stringify(data));
    
    if (document.getElementById('display-biz-name')) {
        document.getElementById('display-biz-name').innerText = data.companyName || "Mon Enseigne";
    }

    alert("✅ Profil enregistré !");
};

// --- 2. CHARGEMENT AU DÉMARRAGE ---
window.addEventListener('DOMContentLoaded', () => {
    const saved = JSON.parse(localStorage.getItem('ox_profile_settings'));
    if (!saved) return;

    const ids = ['biz-name', 'biz-siret', 'biz-tva', 'biz-phone', 'biz-web', 'biz-address', 'biz-footer'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Mapping des clés pour correspondre à l'objet sauvegardé
            const key = id === 'biz-name' ? 'companyName' : (id === 'biz-tva' ? 'tvaIntra' : id.replace('biz-', ''));
            el.value = saved[key] || "";
        }
    });
});



// Fonction pour injecter les infos dans les factures
window.updateInvoicesWithProfile = function(data) {
    if (!data) data = JSON.parse(localStorage.getItem('ox_profile_settings'));
    if (!data) return;

    // Mise à jour du nom de l'enseigne dans le Header
    const displayBiz = document.getElementById('display-biz-name');
    if (displayBiz) displayBiz.innerText = data.companyName || "Mon Enseigne";

    // Mise à jour des champs sur la facture (Partie Admin / Facturation)
    // Assure-toi que tes éléments de facture ont ces IDs :
    const mapping = {
        'inv-seller-name': data.companyName,
        'inv-seller-address': data.address,
        'inv-seller-siret': "SIRET : " + data.siret,
        'inv-seller-tva': "TVA : " + data.tvaIntra,
        'inv-seller-phone': data.phone,
        'inv-footer-text': data.footer
    };

    for (let [id, value] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    // Logo sur la facture
    const invLogo = document.getElementById('inv-logo-preview');
    if (invLogo && data.logo) invLogo.src = data.logo;
};

// Chargement automatique au démarrage de la page
window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('ox_profile_settings'));
    if (saved) {
        // Remplir le formulaire de réglages
        const fields = {
            'biz-name': saved.companyName,
            'biz-siret': saved.siret,
            'biz-tva': saved.tvaIntra,
            'biz-phone': saved.phone,
            'biz-web': saved.web,
            'biz-address': saved.address,
            'biz-footer': saved.footer
        };

        for (let [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        }

        if (saved.logo && document.getElementById('user-logo-preview')) {
            document.getElementById('user-logo-preview').src = saved.logo;
        }

        // Appliquer aux factures
        window.updateInvoicesWithProfile(saved);
    }
});


// --- 3. RESTE DU CODE (TON CODE CRM, etc.) ---
// Tes fonctions renderCustomers etc. commencent ici...
// ==========================================================================
// DASHBOARD
// ==========================================================================
// ==========================================================================
// 1. CONFIGURATION & DONNÉES
// ==========================================================================
window.savedDeals = JSON.parse(localStorage.getItem('ox_history')) || [];

// Utilitaire pour transformer n'importe quoi en nombre (enlève "€", les espaces, etc.)
const toNum = (val) => {
    if (!val) return 0;
    const n = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(n) ? 0 : n;
};

// ==========================================================================
// 2. LE DASHBOARD (TON CODE OPTIMISÉ)
// ==========================================================================
window.updateDashboard = function() {
    // 1. RÉCUPÉRATION DES DONNÉES (Tes variables globales)
    const stock = window.savedDeals || [];
    const leads = window.contacts || [];

    // 2. COMPTAGES SIMPLES
    const vehiculesEnStock = stock.filter(v => v.status !== "VENDU");
    const vehiculesVendus = stock.filter(v => v.status === "VENDU");

    // 3. CALCUL FINANCIER BASIQUE
    let margeBrute = 0;
    vehiculesVendus.forEach(v => {
        const achat = parseFloat(v.purchase) || 0;
        const vente = parseFloat(v.soldPrice) || 0;
        const frais = parseFloat(v.prepFees || v.repairs) || 0;
        margeBrute += (vente - (achat + frais));
    });

    const tva = margeBrute * 0.20;
    const net = margeBrute - tva;

    // 4. AFFICHAGE DANS TON HTML (IDs de tes captures)
    
    // --- Bloc Trésorerie ---
    if(document.getElementById('kpi-cash')) 
        document.getElementById('kpi-cash').innerText = net.toLocaleString() + " €";
    if(document.getElementById('dash-tva-value')) 
        document.getElementById('dash-tva-value').innerText = tva.toLocaleString() + " €";

    // --- Bloc Performance ---
    if(document.getElementById('kpi-marge')) 
        document.getElementById('kpi-marge').innerText = margeBrute.toLocaleString() + " €";

    // --- Bloc Stock ---
    if(document.getElementById('kpi-stock-value')) {
        const totalAchat = vehiculesEnStock.reduce((s, v) => s + (parseFloat(v.purchase) || 0), 0);
        document.getElementById('kpi-stock-value').innerText = totalAchat.toLocaleString() + " €";
    }
    if(document.getElementById('kpi-stock-count-detail')) 
        document.getElementById('kpi-stock-count-detail').innerText = vehiculesEnStock.length + " véhicules";

    // --- Bloc Logistique (Comptage par texte exact) ---
    const setLog = (id, label) => {
        const el = document.getElementById(id);
        if(el) el.innerText = vehiculesEnStock.filter(v => v.status === label).length;
    };
    setLog('log-prep', 'EN PRÉPARATION');
    setLog('log-prov', 'CHEZ LE PRESTATAIRE');
    setLog('log-ready', 'PRÊT À LA VENTE');

    // --- Bloc CRM ---
    if(document.getElementById('crm-total')) 
        document.getElementById('crm-total').innerText = leads.length;
    if(document.getElementById('crm-nego')) 
        document.getElementById('crm-nego').innerText = leads.filter(l => l.status === 'négociation').length;

    // --- Remplacement du Graphique par une info simple ---
    const chartCont = document.getElementById('dash-chart-container');
    if(chartCont) {
        chartCont.style.display = "flex";
        chartCont.style.alignItems = "center";
        chartCont.style.justifyContent = "center";
        chartCont.innerHTML = `<div style="text-align:center; color:#64748b;">
            <div style="font-size:1.5rem; font-weight:bold; color:var(--accent);">${vehiculesVendus.length}</div>
            <div style="font-size:0.7rem;">VENTES RÉALISÉES</div>
        </div>`;
    }

    // --- Nettoyage des Alertes ---
    const alertBox = document.getElementById('dash-alerts');
    if(alertBox) {
        alertBox.innerHTML = `<div style="padding:10px; color:#22c55e; font-size:0.75rem;">✅ Système synchronisé avec le stock (${stock.length} dossiers)</div>`;
    }

    if (window.lucide) lucide.createIcons();
};

window.triggerSaleProcess = function() {
    const history = JSON.parse(localStorage.getItem('ox_history')) || [];
    // On ne propose à la vente que les véhicules qui ne sont pas déjà vendus
    const availableVehicles = history.filter(v => v.status !== "VENDU");

    if (availableVehicles.length === 0) {
        alert("Aucun véhicule en stock à vendre !");
        return;
    }

    // 1. Choix du véhicule (simple prompt pour l'exemple, à adapter selon ton interface)
    const vehicleList = availableVehicles.map((v, i) => `${i + 1}. ${v.brand} ${v.model} (${v.plate || 'Sans plaque'})`).join('\n');
    const choice = prompt(`Sélectionnez le véhicule vendu :\n${vehicleList}`);
    
    if (choice) {
        const index = parseInt(choice) - 1;
        const selectedVehicle = availableVehicles[index];
        
        // 2. Saisie du prix de vente
        const soldPrice = prompt(`Prix de vente final pour ${selectedVehicle.model} ?`, selectedVehicle.price || 0);
        
        if (soldPrice) {
            // Trouver l'index réel dans l'historique complet
            const realIndex = history.findIndex(v => v === selectedVehicle);
            
            // 3. MISE À JOUR DES DONNÉES
            history[realIndex].status = "VENDU";
            history[realIndex].soldPrice = parseFloat(soldPrice);
            // Crucial pour le graphique :
            history[realIndex].dateVente = new Date().toISOString(); 

            // Sauvegarde
            localStorage.setItem('ox_history', JSON.stringify(history));
            
            // 4. RAFRAÎCHISSEMENT INSTANTANÉ
            alert("Vente enregistrée !");
            if (window.updateDashboard) window.updateDashboard();
        }
    }
};
// ==========================================================================
// 3. ACTIONS (AJOUT, VENTE, RESET)
// ==========================================================================

window.addVehicleToStock = function() {
    // 1. Récupération des valeurs du formulaire
    const brand = document.getElementById('in-brand')?.value || "";
    const model = document.getElementById('in-model')?.value || "";
    const price = document.getElementById('in-price')?.value || 0;
    
    // Récupération des infos vendeur (Section Analyse)
    const sName = document.getElementById('v-name')?.value || "Non renseigné";
    const sPhone = document.getElementById('v-phone')?.value || "Non renseigné";
    const sProfile = document.getElementById('v-profile')?.value || "NC";

    // 2. Saisie forcée via prompts
    const plate = prompt("Immatriculation (ex: BY-243-AC) :", "");
    const kmValue = prompt("Kilométrage (ex: 125000) :", "0");

    // 3. Création de l'objet véhicule
    const newVehicle = {
        id: "ID-" + Date.now(),
        brand: brand,
        model: model,
        plate: plate || "N/C",
        km: kmValue || "0",
        seller_name: sName,
        seller_phone: sPhone,
        source: sProfile,
        purchase: parseFloat(price) || 0,
        repairs: 0, 
        fees: 0,
        status: "ACHETÉ",
        date: new Date().toLocaleDateString('fr-FR')
    };

    // --- L'ÉTAPE QUI MANQUAIT : L'AJOUT DANS LA LISTE ---
    // On s'assure que window.savedDeals existe
    if (!window.savedDeals) {
        window.savedDeals = JSON.parse(localStorage.getItem('ox_history')) || [];
    }

    // On ajoute le nouveau véhicule dans le tableau
    window.savedDeals.push(newVehicle);

    // 4. Sauvegarde et Rafraîchissement
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));

    alert("Véhicule enregistré avec succès !");

    // 5. Mise à jour de l'affichage sans tout casser
    if (typeof window.renderInventory === "function") {
        window.renderInventory();
    } else {
        location.reload(); // Si la fonction de rendu n'est pas dispo, on recharge
    }
};
window.triggerSaleProcess = function() {
    const stock = window.savedDeals.filter(d => d.status !== "VENDU");
    if (stock.length === 0) return alert("Stock vide.");

    const choice = prompt("Choisir véhicule :\n" + stock.map((d, i) => `${i+1}. ${d.model}`).join('\n'));
    const index = parseInt(choice) - 1;

    if (stock[index]) {
        const p = prompt("Prix de vente final :");
        const d = prompt("Date de vente (AAAA-MM-JJ) :", new Date().toISOString().split('T')[0]);

        if (p) {
            const v = window.savedDeals.find(item => item.id === stock[index].id);
            v.soldPrice = toNum(p);
            v.date_out = d || new Date().toISOString();
            v.status = "VENDU";
            saveAndRefresh();
        }
    }
};

window.resetAllData = function() {
    if (confirm("Supprimer TOUTES les données ?")) {
        window.savedDeals = [];
        localStorage.removeItem('ox_history');
        window.updateDashboard();
    }
};

function saveAndRefresh() {
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    window.updateDashboard();
}

// Lancement
document.addEventListener('DOMContentLoaded', () => window.updateDashboard());

// ==========================================================================
// SAUVEGARDE DEPUIS L'ANALYSE (VERSION ROBUSTE)
// ==========================================================================
// ==========================================================================
// SAUVEGARDE DEPUIS L'ANALYSE (VERSION ROBUSTE - FIX NC)
// ==========================================================================
window.saveAnalysisFolder = function() {
    console.log("🚀 Tentative de sauvegarde...");

    // 1. Récupération des éléments
    const statusSelect = document.querySelector('.contact-card select') || document.getElementById('in-analysis-status');
    const allInputs = document.querySelectorAll('input');
    
    // On nettoie la valeur pour enlever les émojis potentiels qui bloquent le test
    const currentStatus = statusSelect?.value.toUpperCase() || "";

    // 2. Création de l'objet de base (On garde tes allInputs[0] et [1])
    let deal = {
        id: "ID-" + Date.now(),
        model: allInputs[1]?.value || "Modèle inconnu",
        plate: allInputs[0]?.value || "N/A",
        
        // --- AJOUT UNIQUEMENT DE CES LIGNES POUR FIXER LE "NC" ---
        seller_name: document.getElementById('vendeur-nom')?.value || "NC",
        seller_phone: document.getElementById('vendeur-tel')?.value || "NC",
        source: document.getElementById('source-annonce')?.value || "NC",
        // -------------------------------------------------------

        purchase: 0,
        km: "0", 
        status: currentStatus,
        date: new Date().toLocaleDateString('fr-FR')
    };

    // 3. LOGIQUE DE TRI : On vérifie si le mot "ACHETÉ" est présent
    if (currentStatus.includes("ACHETÉ") || currentStatus.includes("ACHETE")) {
        // Demande du prix
        const p = prompt(`💰 Prix d'achat final pour ${deal.model} ?`, "0");
        if (p === null) return; // Annulation

        // Demande du kilométrage
        const k = prompt(`🛣️ Kilométrage réel pour ${deal.model} ?`, "0");
        if (k === null) return; // Annulation

        deal.purchase = parseFloat(p.replace(/\s/g, '')) || 0;
        deal.km = k; 
        deal.status = "ACHETÉ"; 
        
        window.savedDeals.unshift(deal);
        alert("✅ Véhicule ajouté au stock !");
    } 
    // Sinon, si c'est un refus ou une attente
    else {
        const reason = prompt("📝 Raison du refus/attente :");
        if (reason === null) return; 
        
        deal.reason = reason || "N/C";
        window.savedDeals.unshift(deal);
        alert(`📁 Dossier classé : ${currentStatus}`);
    }

    // 4. Sauvegarde physique
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.updateDashboard === "function") window.updateDashboard();
};

// ==========================================================================
// 1. GESTION DE L'EXPERTISE & CLICS
// ==========================================================================

window.handleCheck = function(name, val, btn) {
    if (!window.checks) window.checks = {};
    window.checks[name] = val;
    
    const parent = btn.parentElement;
    if (parent) {
        parent.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    
    if (typeof window.runCalculations === 'function') {
        window.runCalculations();
    }
};

window.checks = window.checks || {};

window.renderExpertise = function() {
    const container = document.getElementById('checklist-render');
    if (!container) return;

    container.innerHTML = inspectionConfig.map(pt => {
        const conf = window.configExpertise[pt.name] || { val: 0, type: 'price' };
        const safeName = pt.name.replace(/'/g, "\\'"); 

        return `
        <div class="card check-item">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span>
                    <small style="color:var(--accent); font-weight:700;">${pt.cat}</small><br>
                    <strong>${pt.name}</strong><br>
                    <small style="opacity:0.6">${conf.val} ${conf.type === 'price' ? '€' : 'pts'}</small>
                </span>
                <div class="pill-group">
                    <button class="pill-btn btn-ok ${window.checks[pt.name] === 1 ? 'active' : ''}" 
                            onclick="window.handleCheck('${safeName}', 1, this)">OK</button>
                    <button class="pill-btn btn-ko ${window.checks[pt.name] === 0 ? 'active' : ''}" 
                            onclick="window.handleCheck('${safeName}', 0, this)">KO</button>
                </div>
            </div>
        </div>`;
    }).join('');
};

// ==========================================================================
// 2. MOTEUR DE CALCULS (CORRECTION FINALE & SYNCHRONISATION)
// ==========================================================================
window.runCalculations = function() {
    // 1. Récupération des prix (Analyse) avec sauvegarde pour CodePen
    const getVal = (id) => {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null) {
            const val = parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0;
            window[id + '_backup'] = val; 
            return val;
        }
        return window[id + '_backup'] || 0;
    };

    const market = getVal('market-val');
    const purchase = getVal('target-price');
    const fees = getVal('fees-admin');
    
    // Récupération des réglages business (prépa esthétique)
    const biz = JSON.parse(localStorage.getItem('ox_business_settings')) || { defaultPrep: 0 };
    const prepEsthetique = parseFloat(biz.defaultPrep) || 0;
    
    let totalCash = 0; // Somme des euros KO
    let totalPts = 0;  // Somme des points KO (pour le score % )

    // 2. BOUCLE SUR TES 27 POINTS (Liaison Courroie, Turbo, etc.)
    // On utilise ta variable globale 'inspectionConfig'
    inspectionConfig.forEach(pt => {
        if (window.checks[pt.name] === 0) { // Si l'élément est mis en KO
            const config = window.configExpertise[pt.name];
            if (config) {
                if (config.type === 'price') {
                    totalCash += parseFloat(config.val) || 0; // Ajoute les 600€ par ex.
                } else {
                    totalPts += parseFloat(config.val) || 0; // Ajoute les points
                }
            }
        }
    });

    // 3. LE CALCUL DE LA MARGE NETTE
    // Formule : Prix de vente - (Achat + Réparations + Frais + Prépa)
    const margeNet = market - (purchase + totalCash + fees + prepEsthetique);
    const scoreIA = Math.max(0, 100 - totalPts);

    // 4. MISE À JOUR VISUELLE
    // Encart central "Repairs"
    const repairsInput = document.getElementById('repairs');
    if (repairsInput) repairsInput.value = totalCash.toLocaleString() + " €";

    // Envoi à la barre IA
    if (typeof window.updateIAVerdict === "function") {
        window.updateIAVerdict(margeNet, scoreIA, totalCash, market, fees, prepEsthetique);
    }

    // Mise à jour des petits badges (Ronds Flash)
    const upd = (id, text) => { if(document.getElementById(id)) document.getElementById(id).innerText = text; };
    upd('flash-repairs', totalCash.toLocaleString() + " €");
    upd('flash-marge', Math.round(margeNet).toLocaleString() + " €");
    upd('flash-score', scoreIA + "/100");
};

// ==========================================================================
// 4. VERDICT IA (CORRECTION DE LA LOGIQUE DE COULEUR)
// ==========================================================================

window.updateIAVerdict = function(marge, score, repairs, market, fees, prep) {
    const biz = JSON.parse(localStorage.getItem('ox_business_settings')) || { targetProfit: 1000 };
    const targetProfit = parseFloat(biz.targetProfit) || 1000;
    
    const verdictEl = document.getElementById('ia-verdict');
    const confidenceEl = document.getElementById('confidence-level');
    const margeEl = document.getElementById('marge-val'); // L'élément du bénéfice estimé

    // 1. Affichage du bénéfice (Baisse en temps réel)
    if (margeEl) {
        margeEl.innerText = Math.round(marge).toLocaleString() + " €";
        
        // Couleur dynamique : Vert si rentable, Rouge si perte
        if (marge >= targetProfit) margeEl.parentElement.style.color = "#22c55e";
        else if (marge > 0) margeEl.parentElement.style.color = "#3b82f6";
        else margeEl.parentElement.style.color = "#ef4444";
    }

    // 2. Verdict textuel et couleur de barre
    let color = "#ef4444";
    let verdict = "DANGER : AUCUNE RENTABILITÉ";

    if (marge > 0) {
        if (score < 60) {
            verdict = "RISQUE : ÉTAT TECHNIQUE DÉGRADÉ";
            color = "#f59e0b";
        } else {
            verdict = (marge >= targetProfit) ? "EXCELLENT SIGNAL : ACHAT VALIDÉ" : "NÉGOCIATION REQUISE";
            color = (marge >= targetProfit) ? "#22c55e" : "#3b82f6";
        }
    }

    if (verdictEl) {
        verdictEl.innerText = verdict;
        verdictEl.style.color = color;
    }
    
    if (confidenceEl) {
        confidenceEl.style.width = score + "%";
        confidenceEl.style.backgroundColor = color;
    }
};

window.updateDashboard = function() {
    console.log("📊 Synchronisation du Tableau de Bord...");

    // 1. DATA SOURCES
    const deals = JSON.parse(localStorage.getItem('ox_history')) || [];
    const settings = JSON.parse(localStorage.getItem('ox_business_settings')) || {};
    const profile = JSON.parse(localStorage.getItem('ox_profile_data')) || {};
    const targetMarge = parseFloat(localStorage.getItem('targetProfit')) || 2000;
    const contacts = JSON.parse(localStorage.getItem('ox_crm_contacts')) || [];

    // 2. FILTRES & CALCULS
    const inStock = deals.filter(d => d.status !== "VENDU");
    const sold = deals.filter(d => d.status === "VENDU");
    
    const stockValue = inStock.reduce((sum, d) => sum + (parseFloat(d.purchase) || 0) + (parseFloat(d.prepFees || d.repairs) || 0), 0);
    
    const totalMarge = sold.reduce((sum, d) => {
        const cost = (parseFloat(d.purchase) || 0) + (parseFloat(d.prepFees || d.repairs) || 0);
        return sum + ((parseFloat(d.soldPrice) || 0) - cost);
    }, 0);

    let avgRotation = 0;
    if (sold.length > 0) {
        const totalDays = sold.reduce((sum, d) => {
            const diff = new Date(d.dateVente || Date.now()) - new Date(d.dateAchat || d.dateAction);
            return sum + (diff / (1000 * 60 * 60 * 24));
        }, 0);
        avgRotation = Math.round(totalDays / sold.length);
    }

    // --- FONCTION DE MISE À JOUR MULTI-CIBLES (POUR TES COPIER-COLLER) ---
    const update = (id, value, isHTML = false) => {
        document.querySelectorAll(`[id="${id}"]`).forEach(el => {
            if (isHTML) el.innerHTML = value; else el.innerText = value;
        });
    };

    // 3. MISE À JOUR KPI FINANCE
    update('dash-welcome', `Ravi de vous revoir, ${profile.name || 'Marchand'}. Voici l'état de votre parc.`);
    update('dash-date', new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}));
    
    update('kpi-marge', `${totalMarge.toLocaleString('fr-FR')} €`);
    update('kpi-stock-value', `${stockValue.toLocaleString('fr-FR')} €`);
    update('kpi-stock-count-detail', `${inStock.length} véhicules`);
    update('kpi-rotation', avgRotation);

    const tva = totalMarge * 0.20;
    update('dash-tva-value', `- ${tva.toLocaleString('fr-FR')} €`);
    update('kpi-cash', `${(totalMarge - tva).toLocaleString('fr-FR')} €`);

    // 4. OBJECTIF & BARRE DE PROGRESSION
    const progress = Math.min((totalMarge / targetMarge) * 100, 100);
    document.querySelectorAll('#dash-progress-bar').forEach(pBar => pBar.style.width = progress + "%");
    
    const statusText = progress >= 100 ? "🎯 OBJECTIF ATTEINT" : `RESTE À GÉNÉRER : ${(targetMarge - totalMarge).toLocaleString()} €`;
    update('dash-obj-status', statusText);

    // 5. LOGISTIQUE & CRM (Mis à jour partout simultanément)
    update('log-prep', inStock.filter(v => 
        v.logStatus === 'prépa' || v.status === 'EN PRÉPARATION' || v.logistique === 'En cours'
    ).length);

    update('log-prov', inStock.filter(v => 
        v.logStatus === 'prestataire' || v.status === 'CHEZ LE PRESTATAIRE' || v.logistique === 'Externe'
    ).length);

    update('log-ready', inStock.filter(v => 
        v.logStatus === 'prêt' || v.status === 'PRÊT À LA VENTE' || v.status === 'ACHETÉ'
    ).length);

    update('crm-total', contacts.length);
    update('crm-nego', contacts.filter(c => c.step === 'négociation').length);

    // 6. GRAPHIQUE DYNAMIQUE
    const chartHTML = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        const count = sold.filter(s => new Date(s.dateVente || s.dateAction).toLocaleDateString() === dateStr).length;
        const height = count > 0 ? (count * 40) : 5; 
        return `<div style="flex:1; background:${count > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}; height:${height}%; border-radius:4px; position:relative;" title="${count} ventes">
            ${count > 0 ? `<span style="position:absolute; top:-20px; left:50%; transform:translateX(-50%); font-size:0.6rem; color:var(--accent);">${count}</span>` : ''}
        </div>`;
    }).reverse().join('');
    
    update('dash-chart-container', chartHTML, true);

    // 7. SYSTÈME D'ALERTES
    let alerts = [];
    const stagnant = inStock.filter(v => (new Date() - new Date(v.dateAchat || v.dateAction)) / 86400000 > 30);
    if(stagnant.length > 0) alerts.push(`🚗 ${stagnant.length} véhicules stagnant (+30j)`);
    
    const inPrepCount = inStock.filter(v => v.logStatus === 'prépa' || v.status === 'EN PRÉPARATION').length;
    if(inPrepCount > 2) alerts.push(`🔧 Atelier surchargé (${inPrepCount} en cours)`);
    if(progress < 30 && new Date().getDate() > 20) alerts.push(`📉 Retard critique sur l'objectif`);

    const finalAlertsHTML = alerts.map(a => `
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid #f59e0b; font-size:0.7rem; color:#ccc;">${a}</div>
    `).join('') || "<div style='color:#22c55e; font-size:0.75rem;'>✅ Aucune anomalie détectée</div>";

    update('dash-alerts', finalAlertsHTML, true);

    if (window.lucide) lucide.createIcons();
};
// ==========================================================================
// 5. MODULE ANNONCE
// ==========================================================================

// 1. On charge les données dans le menu (Indispensable pour avoir les infos du VH)
window.loadAdVehicles = function() {
    const select = document.getElementById('ad-vehicle-select');
    if (!select) return;

    const data = JSON.parse(localStorage.getItem('ox_history')) || [];
    // On filtre pour ne garder que ce qui est en stock
    const stock = data.filter(v => v.status === "ACHETÉ" || v.status === "EN STOCK");

    select.innerHTML = '<option value="">Sélectionnez un véhicule...</option>';
    stock.forEach(v => {
        const option = document.createElement('option');
        option.value = JSON.stringify(v); // On stocke l'objet complet ici
        option.textContent = `${v.plate || 'SANS IMMAT'} - ${v.model || 'SANS MODELE'}`;
        select.appendChild(option);
    });
};

// 2. La fonction de génération qui suit TON script à la lettre
window.generateAd = function() {
    const select = document.getElementById('ad-vehicle-select');
    const template = document.getElementById('ad-template'); // Bloc 2
    const output = document.getElementById('ad-output');     // Bloc 3

    if (!select || !select.value) return;

    try {
        // 1. On récupère l'objet véhicule
        const v = JSON.parse(select.value);

        // 2. CONNEXION : On récupère le texte que TU as écrit dans le Bloc 2
        let texteSource = template.value;

        // 3. REMPLISSAGE : On remplace les balises par les infos du véhicule
        // On utilise .replace() avec /gi pour que ça marche peu importe la casse
        let resultat = texteSource
            .replace(/{MODELE}/gi, v.model || v.modele || "Véhicule")
            .replace(/{KM}/gi, v.km ? v.km.toLocaleString('fr-FR') : "NC")
            .replace(/{IMMAT}/gi, v.plate || v.immat || "NC");

        // Gestion du prix (Vente si dispo, sinon Achat, sinon texte)
        const prixBrut = v.soldPrice || v.purchase || 0;
        const prixFinal = prixBrut > 0 ? prixBrut.toLocaleString('fr-FR') + " €" : "À débattre";
        resultat = resultat.replace(/{PRIX}/gi, prixFinal);

        // 4. AFFICHAGE : On balance le tout dans le Bloc 3
        output.value = resultat;

    } catch (e) {
        console.error("Erreur de connexion entre les blocs :", e);
    }
};

// --- LA COLLE (EventListeners) ---
// Ces lignes connectent les blocs en temps réel
document.getElementById('ad-vehicle-select').addEventListener('change', window.generateAd);
document.getElementById('ad-template').addEventListener('input', window.generateAd);
// ==========================================================================
// 5. MODULE STOCK & INVENTAIRE
// ==========================================================================
window.saveCurrentDeal = function() {
    const model = document.getElementById('model-name')?.value;
    if (!model) return alert("Modèle requis !");

    const getVal = (id, fallback = "NC") => {
        const el = document.getElementById(id);
        return (el && el.value) ? el.value : fallback;
    };

    const purchase = parseFloat(document.getElementById('target-price')?.value) || 0;
    const repairs = parseFloat((document.getElementById('repairs')?.value || "0").replace(' €','')) || 0;
    const fees = parseFloat(document.getElementById('fees-admin')?.value) || 0;

    const deal = {
        model,
        plate: getVal('in-plate', 'N/A'),
        km: typeof kmValue !== 'undefined' ? kmValue : 0, 
        
        // --- LES CORRECTIONS SONT ICI ---
        seller_name: getVal('vendeur-nom', 'NC'),     // Vérifie bien que l'id est 'vendeur-nom'
        seller_phone: getVal('vendeur-tel', 'NC'),    // Vérifie bien que l'id est 'vendeur-tel'
        source: getVal('source-annonce', 'NC'),       // Vérifie bien que l'id est 'source-annonce'
        // --------------------------------
        
        purchase: purchase,
        repairs: repairs,
        fees: fees,
        totalCost: purchase + repairs + fees,
        link: getVal('ad-link', ""),
        photoUrl: "", 
        status: "ACHETÉ",
        date: new Date().toLocaleDateString('fr-FR'),
        maintStep: "Achat",
        checks: {...window.checks}
    };

    window.savedDeals.unshift(deal);
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    alert("✅ Véhicule ajouté au stock !");
    
    if(window.updatePilotage) window.updatePilotage();
    window.renderInventory(); 
};

// ==========================================
// 3. INVENTAIRE AMÉLIORÉ & OPTIMISÉ
// ==========================================
// ==========================================
// 3. INVENTAIRE AMÉLIORÉ & OPTIMISÉ
// ==========================================
window.renderInventory = function() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    // 1. On récupère les données les plus récentes
    const data = JSON.parse(localStorage.getItem('ox_history')) || [];
    window.savedDeals = data;

    // 2. Filtrage strict : on exclut les véhicules "VENDU"
    const stock = data
        .map((d, index) => ({ ...d, originalIndex: index }))
        .filter(d => d.status === "ACHETÉ");

    // 3. Rendu (la grille se nettoie et se remplit uniquement avec le stock actuel)
    grid.innerHTML = stock.map((d) => {
        const prk = toNum(d.purchase) + toNum(d.repairs) + toNum(d.fees);
        const imgPath = d.photoUrl || 'https://via.placeholder.com/400x200?text=Pas+de+photo';
        
        return `
        <div class="card inventory-card" onclick="window.showVehicleDetails(${d.originalIndex})" 
             style="cursor:pointer; padding:0; overflow:hidden; border:1px solid #333; background:#1a1a1a; color:white;">
            <div style="height:150px; background:url('${imgPath}') center/cover #222;"></div>
            <div style="padding:15px;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <div>
                        <strong style="font-size:1.1rem;">${d.brand || ''} ${d.model || 'Véhicule'}</strong><br>
                        <small style="color:#888;">${d.year || 'NC'} • ${d.km || d.mileage || 0} km</small>
                    </div>
                </div>
                <div style="background:#252525; padding:8px; border-radius:6px; display:flex; justify-content:space-between; font-size:0.85rem;">
                    <span>PRK: <strong>${prk.toLocaleString()} €</strong></span>
                    <span style="color:var(--accent); font-weight:bold;">${d.plate || 'N/A'}</span>
                </div>
            </div>
        </div>`;
    }).join('');
};


window.deleteVehicle = function(index) {
    if (confirm("Supprimer ce véhicule définitivement ?")) {
        window.savedDeals.splice(index, 1);
        localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
        
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.remove();
        
        if (window.renderInventory) window.renderInventory();
        else location.reload();
    }
};




window.showVehicleDetails = function(index) {
    const d = window.savedDeals[index];
    if (!d) return;

    const prk = toNum(d.purchase) + toNum(d.repairs) + toNum(d.fees);
    
    const existing = document.getElementById('modal-overlay');
    if (existing) existing.remove();

    // On vérifie si les infos sont à remplir (NC ou vide)
    const isMissing = (!d.seller_name || d.seller_name === "NC" || d.seller_name === "Non renseigné");

    const contactContent = isMissing ? `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <input type="text" id="edit-name-${index}" placeholder="Nom du vendeur" value="${d.seller_name !== 'NC' ? (d.seller_name || '') : ''}" style="padding:6px; border:1px solid #ccc; border-radius:4px; font-size:0.8rem;">
            <input type="text" id="edit-phone-${index}" placeholder="Téléphone" value="${d.seller_phone || ''}" style="padding:6px; border:1px solid #ccc; border-radius:4px; font-size:0.8rem;">
            <input type="text" id="edit-address-${index}" placeholder="Adresse / Ville" value="${d.address || ''}" style="padding:6px; border:1px solid #ccc; border-radius:4px; font-size:0.8rem;">
            <input type="text" id="edit-reason-${index}" placeholder="Raison de la vente" value="${d.reason || ''}" style="padding:6px; border:1px solid #ccc; border-radius:4px; font-size:0.8rem;">
            <select id="edit-pay-${index}" style="padding:6px; border:1px solid #ccc; border-radius:4px; font-size:0.8rem;">
                <option value="">Moyen de paiement...</option>
                <option value="Virement" ${d.payment_method === 'Virement' ? 'selected' : ''}>Virement</option>
                <option value="Chèque de banque" ${d.payment_method === 'Chèque de banque' ? 'selected' : ''}>Chèque de banque</option>
                <option value="Espèces" ${d.payment_method === 'Espèces' ? 'selected' : ''}>Espèces</option>
            </select>
            <button onclick="window.quickUpdateContact(${index})" style="background:#333; color:white; border:none; border-radius:4px; padding:8px; font-size:0.75rem; cursor:pointer; font-weight:bold;">ENREGISTRER LE DOSSIER</button>
        </div>
    ` : `
        <div style="margin-top:5px; font-size:0.9rem;">Vendeur: <strong>${d.seller_name}</strong></div>
        <div style="margin-top:2px; font-size:0.9rem;">Tél: <strong>${d.seller_phone || 'NC'}</strong></div>
        ${d.address ? `<div style="margin-top:4px; font-size:0.85rem; color:#555;">📍 ${d.address}</div>` : ''}
        ${d.reason ? `<div style="margin-top:4px; font-size:0.85rem; color:#555;">💬 ${d.reason}</div>` : ''}
        ${d.payment_method ? `<div style="margin-top:4px; font-size:0.85rem; color:#555;">💳 ${d.payment_method}</div>` : ''}
        <button onclick="window.resetContact(${index})" style="margin-top:10px; background:none; border:none; color:#2563eb; text-decoration:underline; font-size:0.75rem; cursor:pointer; padding:0; font-weight:bold;">✏️ Modifier les infos</button>
    `;

    const detailHtml = `
        <div id="modal-overlay" onclick="this.remove()" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; padding:15px;">
            <div class="card" onclick="event.stopPropagation()" style="width:100%; max-width:550px; background:white; color:#333; padding:0; border-radius:12px; overflow:hidden; font-family: sans-serif;">
                
                <div id="photo-container" style="height:200px; background:url('${d.photoUrl || ''}') center/cover #eee; position:relative;">
                    <button onclick="document.getElementById('modal-overlay').remove()" style="position:absolute; top:15px; right:15px; background:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; font-weight:bold;">&times;</button>
                </div>

                <div style="padding:20px;">
                    <h2 style="margin:0;">${d.brand || ''} ${d.model || 'Véhicule'}</h2>
                    <p style="color:#666; margin-bottom:20px;">Immat : <strong>${d.plate || 'N/A'}</strong></p>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
                        <div style="background:#f4f4f4; padding:12px; border-radius:8px;">
                            <small style="color:#888; font-weight:bold;">SOLDE FINANCIER</small>
                            <div style="margin-top:5px;">Achat: <strong>${toNum(d.purchase).toLocaleString()} €</strong></div>
                            <div style="margin-top:2px;">Travaux: <strong>${toNum(d.repairs).toLocaleString()} €</strong></div>
                            <div style="margin-top:5px; border-top:1px solid #ddd; color:#e63946; font-weight:bold; padding-top:5px;">PRK: ${prk.toLocaleString()} €</div>
                        </div>
                        <div style="background:#f4f4f4; padding:12px; border-radius:8px;">
                            <small style="color:#888; font-weight:bold;">INFOS COMPLÉMENTAIRES</small>
                            ${contactContent}
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button onclick="window.archiveSold(${index})" style="flex:5; padding:15px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1.1rem;">
                            MARQUER COMME VENDU
                        </button>
                        <button onclick="window.deleteVehicle(${index})" style="flex:1; padding:15px; background:#fee2e2; color:#ef4444; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1.1rem;">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', detailHtml);
};

window.quickUpdateContact = function(index) {
    const nameVal = document.getElementById(`edit-name-${index}`).value;
    const phoneVal = document.getElementById(`edit-phone-${index}`).value;
    const addressVal = document.getElementById(`edit-address-${index}`).value;
    const reasonVal = document.getElementById(`edit-reason-${index}`).value;
    const payVal = document.getElementById(`edit-pay-${index}`).value;

    if (!nameVal) {
        alert("Le nom est obligatoire pour enregistrer.");
        return;
    }

    // 1. MISE À JOUR DU VÉHICULE DANS LE STOCK
    const vehicle = window.savedDeals[index];
    vehicle.seller_name = nameVal;
    vehicle.seller_phone = phoneVal;
    vehicle.address = addressVal;
    vehicle.reason = reasonVal;
    vehicle.payment_method = payVal;

    // Sécurité pour éviter le "undefined" dans le CRM
    const vMarque = vehicle.brand || vehicle.marque || "";
    const vModele = vehicle.model || vehicle.modele || "Véhicule";
    const fullVehicleName = `${vMarque} ${vModele}`.trim();

    // 2. INJECTION DANS TON CRM (savedCustomers)
    const existingIndex = window.savedCustomers.findIndex(c => 
        (c.name.toLowerCase() === nameVal.toLowerCase()) && c.type === "VENTE"
    );

    const customerData = {
        name: nameVal,
        phone: phoneVal,
        type: "VENTE",
        status: "CONCLU",
        date: new Date().toLocaleDateString('fr-FR'),
        vehicle: fullVehicleName, // Nom propre sans undefined
        notes: `Raison: ${reasonVal || 'NC'} | Payé par: ${payVal || 'NC'} | 📍 ${addressVal || 'NC'}`,
        budget: vehicle.purchase 
    };

    if (existingIndex !== -1) {
        window.savedCustomers[existingIndex] = customerData;
    } else {
        window.savedCustomers.push(customerData);
    }

    // 3. SAUVEGARDE GLOBALE
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    localStorage.setItem('ox_customers', JSON.stringify(window.savedCustomers));

    // 4. RAFRAÎCHISSEMENT
    window.showVehicleDetails(index);
    if (window.renderCustomers) window.renderCustomers();
    
    alert(`Vendeur "${nameVal}" enregistré dans le stock et le CRM !`);
};

// FONCTION POUR PERMETTRE LA MODIFICATION
window.resetContact = function(index) {
    // On force l'état "Missing" pour afficher le formulaire de saisie
    const vehicle = window.savedDeals[index];
    const oldName = vehicle.seller_name;
    
    // On vide temporairement le nom en mémoire vive pour que showVehicleDetails affiche le formulaire
    const tempName = vehicle.seller_name;
    vehicle.seller_name = ""; 
    
    window.showVehicleDetails(index);
    
    // On remet le nom au cas où l'utilisateur ferme sans enregistrer
    vehicle.seller_name = tempName; 
};
// ==========================================
// FONCTION PHOTO
// ==========================================
window.updateVehiclePhoto = function(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // Sauvegarde de l'image dans la base de données locale
        window.savedDeals[index].photoUrl = base64Image;
        localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
        
        // Mise à jour visuelle immédiate du modal et de la grille derrière
        const photoContainer = document.getElementById('photo-container');
        if (photoContainer) photoContainer.style.backgroundImage = `url('${base64Image}')`;
        window.renderInventory();
    };
    reader.readAsDataURL(file);
};

window.archiveSold = function(index) {
    const v = window.savedDeals[index];
    if (!v) return;

    // 1. On ferme l'ancienne modal
    const oldModal = document.getElementById('modal-overlay');
    if (oldModal) oldModal.remove();

    // 2. Création de la modal de saisie (Acheteur + Prix)
    const saleHtml = `
        <div id="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:10000; display:flex; align-items:center; justify-content:center; padding:15px;">
            <div class="card" onclick="event.stopPropagation()" style="width:100%; max-width:450px; background:white; color:#333; padding:25px; border-radius:12px; font-family:sans-serif;">
                <h2 style="margin-top:0; color:#10b981;">🎉 Finaliser la vente</h2>
                <p style="font-size:0.9rem; color:#666;">Véhicule : <strong>${v.brand} ${v.model}</strong></p>
                
                <div style="display:flex; flex-direction:column; gap:10px; margin:20px 0;">
                    <label style="font-size:0.75rem; font-weight:bold; color:#888;">INFOS ACHETEUR</label>
                    <input type="text" id="buyer-name" placeholder="Nom de l'acheteur" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                    <input type="text" id="buyer-phone" placeholder="Téléphone" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                    
                    <label style="font-size:0.75rem; font-weight:bold; color:#888; margin-top:5px;">DÉTAILS VENTE</label>
                    <input type="number" id="sale-price" placeholder="Prix de vente final (€)" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                    <input type="date" id="sale-date" value="${new Date().toISOString().split('T')[0]}" style="padding:10px; border:1px solid #ccc; border-radius:6px;">
                </div>

                <div style="display:flex; gap:10px;">
                    <button onclick="document.getElementById('modal-overlay').remove()" style="flex:1; padding:12px; background:#eee; border:none; border-radius:8px; cursor:pointer;">Annuler</button>
                    <button onclick="window.confirmFinalSale(${index})" style="flex:2; padding:12px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">VALIDER LA VENTE</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', saleHtml);
};

window.confirmFinalSale = function(index) {
    const v = window.savedDeals[index];
    const bName = document.getElementById('buyer-name').value;
    const bPhone = document.getElementById('buyer-phone').value;
    const sPrice = document.getElementById('sale-price').value;
    const sDate = document.getElementById('sale-date').value;

    if (!bName || !sPrice) {
        alert("Le nom et le prix sont obligatoires.");
        return;
    }

    // Sécurité pour construire le nom du véhicule sans undefined
    const vMarque = v.brand || v.marque || "";
    const vModele = v.model || v.modele || "Véhicule";
    const fullVehicleName = `${vMarque} ${vModele}`.trim();

    // 1. Application de la Recette Dashboard
    v.soldPrice = toNum(sPrice);
    v.date_out = sDate || new Date().toISOString();
    v.status = "VENDU";
    v.maintStep = "Vendu";
    v.buyer_name = bName;

    // 2. Enregistrement dans le CRM (Acheteur)
    const buyerContact = {
        name: bName,
        phone: bPhone,
        type: "ACHAT",
        status: "CONCLU",
        date: new Date().toLocaleDateString('fr-FR'),
        vehicle: fullVehicleName, // Utilisation du nom propre
        notes: `Achat conclu à ${sPrice}€`,
        budget: sPrice
    };
    
    window.savedCustomers.push(buyerContact);
    localStorage.setItem('ox_customers', JSON.stringify(window.savedCustomers));

    // 3. Sauvegarde et Rafraîchissement global
    if (typeof saveAndRefresh === "function") {
        saveAndRefresh();
    } else {
        localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
        if (window.renderInventory) window.renderInventory();
    }

    // 4. Nettoyage modal et rafraîchissement CRM
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.remove();
    if (window.renderCustomers) window.renderCustomers();

    alert("✅ Vente enregistrée et acheteur ajouté au CRM !");
};

// 6. MODULE LOGISTIQUE (AVANCEMENT)
// ==========================================================================
// ==========================================================================
// SYNC INITIALE : On s'assure que les données sont chargées au démarrage
// ==========================================================================
window.savedDeals = JSON.parse(localStorage.getItem('ox_history')) || [];

window.saveData = function() {
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
};

// ==========================================
// 1. RENDU DE LA LISTE AVEC TRI PAR DATE
// ==========================================
// ==========================================================================
// MODULE LOGISTIQUE COMPLET (COMPTEURS + CARTES + ACTIONS)
// ==========================================================================

window.renderMaintenance = function() {
    const list = document.getElementById('maintenance-list');
    if (!list) return;

    // 1. Récupération des données
    const data = JSON.parse(localStorage.getItem('ox_history')) || [];
    window.savedDeals = data; 
    
    const stock = data
        .map((d, index) => ({ ...d, realIdx: index }))
        .filter(d => d.status === "ACHETÉ");

    // 2. Initialisation des compteurs
    let prepCount = 0;
    let externalCount = 0;
    let readyCount = 0;
    let totalInvested = 0;

    // 3. Calcul et génération du HTML des cartes
    list.innerHTML = stock.map((d) => {
        const i = d.realIdx;
        const totalInt = (d.interventions || []).reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const prk = (parseFloat(d.purchase) || 0) + (parseFloat(d.fees) || 0) + totalInt;
        
        totalInvested += prk;

        const step = (d.maintStep || 'ACHAT').toUpperCase();
        if (step === 'ACHAT' || step === 'NETTOYAGE') prepCount++;
        else if (step === 'ATELIER' || step === 'CARROSSERIE') externalCount++;
        else if (step === 'PRÊT') readyCount++;

        return `
        <div class="card" style="background:#1a1a1a; border-left: 4px solid #6366f1; padding:15px; margin-bottom:12px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:0.65rem; color:#aaa; background:#252525; padding:2px 8px; border-radius:10px;">${d.date || 'Date NC'}</span>
                <span style="font-size:0.7rem; color:#6366f1; font-weight:bold; text-transform:uppercase;">● ${d.maintStep || 'ACHAT'}</span>
            </div>
            <h3 style="margin:0; font-size:1.1rem; color:white;">${d.brand || ''} ${d.model}</h3>
            <p style="color:#6366f1; font-weight:bold; font-size:0.95rem; margin:5px 0;">PRK Actuel : ${prk.toLocaleString()} €</p>
            <div style="margin-top:12px; display:flex; gap:4px; flex-wrap:wrap;">
                ${['Achat', 'Nettoyage', 'Atelier', 'Carrosserie', 'Prêt'].map(stepName => `
                    <button onclick="window.updateMaintStep(${i}, '${stepName}')" 
                        style="flex:1; font-size:0.65rem; padding:6px 2px; border-radius:4px; border:none; 
                        background:${d.maintStep === stepName ? '#6366f1' : '#252525'}; color:white;">
                        ${stepName}
                    </button>
                `).join('')}
            </div>
            <div style="margin-top:15px; display:flex; gap:5px;">
                <input type="text" id="t-${i}" placeholder="Réparation..." style="flex:2; background:#111; border:1px solid #333; color:white; font-size:0.8rem; padding:6px; border-radius:4px;">
                <input type="number" id="p-${i}" placeholder="€" style="flex:1; background:#111; border:1px solid #333; color:white; font-size:0.8rem; padding:6px; border-radius:4px;">
                <button onclick="window.addIntLog(${i})" style="background:#6366f1; color:white; border:none; padding:0 12px; border-radius:4px;">+</button>
            </div>
            <div style="margin-top:12px; font-size:0.8rem; color:#bbb; background:#222; border-radius:6px; padding: ${(d.interventions || []).length > 0 ? '8px' : '0'};">
                ${(d.interventions || []).map((int, idx) => `
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding:5px 0;">
                        <span>${int.label}</span>
                        <span><strong>${parseFloat(int.price).toLocaleString()} €</strong> 
                        <button onclick="window.delIntLog(${i}, ${idx})" style="color:#ef4444; background:none; border:none; margin-left:8px;">×</button></span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }).join('');

    // --- LA PARTIE QUI CORRIGE TON PROBLÈME DE DOUBLONS ---
    const updateAllInstances = (id, val) => {
        // querySelectorAll trouve TOUS les éléments avec cet ID, même s'ils sont en double
        const elements = document.querySelectorAll(`[id="${id}"]`);
        elements.forEach(el => {
            el.innerText = val;
        });
    };

    // On met à jour toutes les cartes, peu importe l'onglet
    updateAllInstances('maint-count-prep', prepCount);
    updateAllInstances('maint-count-external', externalCount);
    updateAllInstances('maint-count-ready', readyCount);
    updateAllInstances('maint-total-invested', totalInvested.toLocaleString() + " €");
    
    // On force aussi les IDs du dashboard si ils sont différents
    updateAllInstances('log-prep', prepCount);
    updateAllInstances('log-prov', externalCount);
    updateAllInstances('log-ready', readyCount);
};

// ==========================================================================
// ACTIONS (FONCTIONS APPELÉES PAR LES BOUTONS)
// ==========================================================================

window.updateMaintStep = function(i, step) {
    let data = JSON.parse(localStorage.getItem('ox_history')) || [];
    if (!data[i]) return;
    
    data[i].maintStep = step;
    localStorage.setItem('ox_history', JSON.stringify(data));
    window.renderMaintenance(); // Rafraîchissement global immédiat
};

window.addIntLog = function(i) {
    const labelInput = document.getElementById(`t-${i}`);
    const priceInput = document.getElementById(`p-${i}`);
    
    if(!labelInput || !priceInput) return;
    const l = labelInput.value.trim();
    const p = parseFloat(priceInput.value);

    if(!l || isNaN(p)) return;

    let data = JSON.parse(localStorage.getItem('ox_history')) || [];
    if(!data[i].interventions) data[i].interventions = [];
    
    data[i].interventions.push({ label: l, price: p });
    
    // Mise à jour pour les autres modules (Trésorerie/Pilotage)
    data[i].repairs = data[i].interventions.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    localStorage.setItem('ox_history', JSON.stringify(data));
    window.renderMaintenance(); // Rafraîchissement global immédiat
};

window.delIntLog = function(i, idx) {
    let data = JSON.parse(localStorage.getItem('ox_history')) || [];
    if (!data[i] || !data[i].interventions) return;

    data[i].interventions.splice(idx, 1);
    data[i].repairs = data[i].interventions.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    
    localStorage.setItem('ox_history', JSON.stringify(data));
    window.renderMaintenance(); // Rafraîchit tout (cartes + compteurs)
};
// ==========================================
// 3. MISE À JOUR DES CARTES KPI
// ==========================================
// ==========================================================================
// CORRECTIF À APPLIQUER DANS TON MODULE PILOTAGE (TABLEAU DE BORD)
// ==========================================================================
window.updatePilotage = function() {
    const saved = JSON.parse(localStorage.getItem('ox_profile_settings')) || {};
    const welcome = document.getElementById('dash-welcome');
    if (welcome) welcome.innerText = `Ravi de vous revoir, ${saved.companyName || 'Marchand'}.`;
    const dateEl = document.getElementById('dash-date');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});


    // 1. Calcul de la Marge Réalisée
    const margeTotale = vendus.reduce((sum, d) => {
        const achat = parseFloat(d.purchase) || 0;
        const frais = parseFloat(d.fees) || 0;
        const repa = parseFloat(d.repairs) || 0;
        const prixVente = parseFloat(d.sellPrice) || 0;
        
        // PRK = Prix de Revient Kilométrique (Achat + tous les frais)
        const prk = achat + frais + repa;
        return sum + (prixVente - prk);
    }, 0);

    // 2. Mise à jour de l'affichage de la Marge
    const elMarge = document.getElementById('total-benefice') || document.getElementById('marge-mois-value');
    
    if (elMarge) {
        elMarge.innerText = Math.round(margeTotale).toLocaleString() + " €";
        
        // STYLE DYNAMIQUE
        if (margeTotale > 0) {
            elMarge.style.color = "#10b981"; // Vert si bénéfice
        } else if (margeTotale < 0) {
            elMarge.style.color = "#ef4444"; // Rouge si perte
        } else {
            elMarge.style.color = "#666";    // Gris si zéro
        }
    }

    // 3. Mise à jour du Volume (ton ID kpi-stock-count)
    const elCount = document.getElementById('kpi-stock-count');
    if (elCount) elCount.innerText = enStock.length;
    
    // 4. Mise à jour de la Valeur Stock
    const valeurStock = enStock.reduce((sum, d) => sum + (parseFloat(d.purchase) || 0), 0);
    const elValue = document.getElementById('kpi-stock-value');
    if (elValue) elValue.innerText = "Valeur : " + Math.round(valeurStock).toLocaleString() + " €";
};
// ==========================================================================
// 7. MODULE MARKETING & IA TOOLS
// ==========================================================================
window.generateAd = function() {
    const model = document.getElementById('model-name')?.value || "Véhicule";
    const km = document.getElementById('km')?.value || "XX XXX";
    const price = document.getElementById('ad-price')?.value || "0";
    
    document.getElementById('ad-output').value = 
        `🔥 À SAISIR : ${model} 🔥\n\n✅ ${km} km\n✅ ${price} €\n✅ Entièrement révisé\n\n📞 Contactez-nous !`;
};

// ==========================================================================
// 8. MODULE OPTIONS (CONFIGURATION)
// ==========================================================================
window.renderConfigEditor = function() {
    const container = document.getElementById('price-settings-list');
    if (!container) return;

    container.innerHTML = inspectionConfig.map(pt => {
        const conf = window.configExpertise[pt.name];
        return `
        <div class="card" style="margin-bottom:8px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>${pt.name}</span>
            <div style="display:flex; gap:5px;">
                <input type="number" value="${conf.val}" onchange="window.updateConfigVal('${pt.name}', this.value)" style="width:70px; padding:5px; border-radius:5px; border:1px solid #ddd;">
                <select onchange="window.updateConfigType('${pt.name}', this.value)" style="padding:5px; border-radius:5px;">
                    <option value="price" ${conf.type === 'price' ? 'selected' : ''}>€</option>
                    <option value="points" ${conf.type === 'points' ? 'selected' : ''}>Pts</option>
                </select>
            </div>
        </div>`;
    }).join('');
};

window.updateConfigVal = function(name, val) {
    window.configExpertise[name].val = parseFloat(val) || 0;
    localStorage.setItem('ox_config', JSON.stringify(window.configExpertise));
};

window.updateConfigType = function(name, type) {
    window.configExpertise[name].type = type;
    localStorage.setItem('ox_config', JSON.stringify(window.configExpertise));
};

// ==========================================================================
// CONFIGURATION NÉGO : RÉPONSES AUX OBJECTIONS
// ==========================================================================
const ripostesData = {
    particulier: "Je comprends, mais un particulier ne vous offre aucune garantie de paiement et pourra se retourner contre vous pour vice caché pendant 2 ans. Chez moi, c'est l'esprit tranquille.",
    prix: "Je ne discute pas votre prix, je discute l'état du véhicule. Pour payer votre prix, la voiture devrait être vierge de tout frais, ce qui n'est pas le cas ici.",
    garage: "Un garage vous fait une offre de reprise liée à un achat. Moi, je vous achète votre véhicule cash, sans condition de rachat.",
    etat: "Elle présente bien, c'est vrai. Mais techniquement, j'ai listé [X] de frais de remise en état indispensables pour une revente sécurisée.",
    presse: "Justement, je suis là pour vous faire gagner du temps. Une signature, un virement, et vous n'avez plus à vous en occuper.",
    comparaison: "Les prix sur Leboncoin sont des prix 'souhaités', pas des prix de vente réels. Les véhicules qui partent sont ceux affichés au prix que je vous propose."
};

const ackermannPhrases = [
    "Compte tenu des travaux, mon offre de départ, pour un règlement immédiat, est de...",
    "Je fais un effort car votre véhicule m'intéresse, mais je dois rester prudent :",
    "C'est vraiment le maximum que je puisse sortir pour que l'opération reste saine :",
    "Écoutez, je ne peux pas faire plus. C'est mon dernier mot pour un accord ici et maintenant :"
];

// ==========================================================================
// MODULE NÉGOCIATION (ACKERMANN & RIPOSTES) - CORRIGÉ
// ==========================================================================

// 1. Mise à jour des paliers Ackermann
window.updateAckermann = function(target) {
    const container = document.getElementById('ackermann-timeline');
    if(!container || target <= 0) return;

    const ratios = [0.65, 0.85, 0.95, 1]; // 65%, 85%, 95%, 100%
    
    container.innerHTML = ratios.map((r, i) => {
        const price = Math.round(target * r);
        return `
            <div class="card" style="border-top: 4px solid var(--accent); position: relative; padding: 10px; margin-bottom:10px;">
                <div style="font-size: 0.7rem; font-weight: bold; color: var(--accent);">ÉTAPE ${i + 1} (${Math.round(r*100)}%)</div>
                <div style="font-size: 1.1rem; font-weight: 800; margin: 5px 0;">${price.toLocaleString()} €</div>
                <p style="font-size: 0.75rem; color: #666; font-style: italic; line-height: 1.2;">
                    "${ackermannPhrases[i]}"
                </p>
                <button onclick="navigator.clipboard.writeText('${price}'); alert('Prix copié !')" 
                        style="position: absolute; top: 5px; right: 5px; border: none; background: none; cursor: pointer; font-size: 0.8rem;">
                    📋
                </button>
            </div>
        `;
    }).join('');
};

// 2. Génération de la riposte intelligente (LA FONCTION QUI MANQUAIT)
window.generateSmartRiposte = function() {
    const objectionSelect = document.getElementById('v-objection'); // L'ID de ton <select> dans le HTML
    const display = document.getElementById('smart-riposte-display'); // L'ID de la zone d'affichage
    
    if (!objectionSelect || !display) return;

    const key = objectionSelect.value;
    if (!key) {
        display.innerHTML = "<p style='opacity:0.5'>Sélectionnez une objection pour voir la riposte...</p>";
        return;
    }

    // Récupération du montant des réparations pour personnaliser la riposte "état"
    const repairsVal = document.getElementById('repairs')?.value || "0 €";
    
    let text = ripostesData[key] || "";
    text = text.replace("[X]", repairsVal); // On remplace le tag par le vrai montant

    display.innerHTML = `
        <div style="background: var(--bg-card); padding: 15px; border-left: 4px solid var(--accent); border-radius: 5px;">
            <strong style="color: var(--accent); display: block; margin-bottom: 5px;">CONSEIL IA :</strong>
            <span style="font-size: 0.9rem; line-height: 1.4;">"${text}"</span>
        </div>
    `;
};

// 3. Fonction de synchronisation (LA FONCTION QUI MANQUAIT)
window.updateNegoLogic = function() {
    // Cette fonction peut rester vide ou servir à déclencher des logs
    console.log("Logique de négociation synchronisée.");
};

// ==========================================================================
// CRM
// ==========================================================================

// Initialisation des clients
window.savedCustomers = JSON.parse(localStorage.getItem('ox_customers')) || [];

// --- OUVERTURE MODAL AVEC LIAISON STOCK ---
window.openCustomerModal = function() {
    const stockOptions = (window.savedDeals || [])
        .filter(d => d.status === "ACHETÉ")
        .map(d => `<option value="${d.model}">${d.model}</option>`)
        .join('');

    const modalHTML = `
    <div id="customer-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);">
        <div class="card" style="width:95%; max-width:600px; background:#1a1a1a; border:1px solid #333; color:white; padding:25px; border-radius:15px;">
            <h2 style="margin-bottom:20px; color:var(--accent); display:flex; align-items:center; gap:10px;">
                <i data-lucide="user-plus"></i> Fiche Relation Client
            </h2>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div class="form-group">
                    <label>NOM / PRÉNOM</label>
                    <input type="text" id="cust-name" placeholder="Ex: Marc Lavoine" class="modern-input">
                </div>
                <div class="form-group">
                    <label>TÉLÉPHONE</label>
                    <input type="tel" id="cust-phone" placeholder="06..." class="modern-input">
                </div>
                <div class="form-group">
                    <label>TYPE DE PROJET</label>
                    <select id="cust-type" class="modern-input" onchange="window.handleTypeChange(this.value)">
                        <option value="ACHAT">Veut acheter (Sortie Stock)</option>
                        <option value="VENTE">Veut vendre (Entrée Stock)</option>
                        <option value="REPRISE">Reprise + Achat</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label id="label-link">VÉHICULE CIBLÉ</label>
                    <select id="cust-vehicle" class="modern-input">
                        <option value="">-- Choisir un véhicule --</option>
                        ${stockOptions}
                        <option value="Autre">Autre / Non listé</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>BUDGET / PRIX (€)</label>
                    <input type="number" id="cust-budget" placeholder="15000" class="modern-input">
                </div>
                <div class="form-group">
                    <label>ÉTAT NÉGO</label>
                    <select id="cust-status" class="modern-input">
                        <option value="FROID">❄️ Premier contact</option>
                        <option value="CHAUD">🔥 Négo en cours</option>
                        <option value="CONCLU">✅ Conclu</option>
                    </select>
                </div>
            </div>

            <div style="margin-top:15px;">
                <label>NOTES ET DÉTAILS</label>
                <textarea id="cust-notes" placeholder="Détails du projet..." style="height:60px;" class="modern-input"></textarea>
            </div>

            <div style="display:flex; gap:10px; margin-top:25px;">
                <button onclick="document.getElementById('customer-modal').remove()" style="flex:1; padding:12px; background:#333; border:none; color:white; border-radius:8px; cursor:pointer;">Annuler</button>
                <button onclick="window.saveCustomer()" style="flex:2; padding:12px; background:var(--accent); border:none; color:white; border-radius:8px; cursor:pointer; font-weight:bold;">Enregistrer le contact</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.handleTypeChange = function(type) {
    const label = document.getElementById('label-link');
    const select = document.getElementById('cust-vehicle');
    if (type === "VENTE") {
        label.innerText = "VÉHICULE PROPOSÉ PAR CLIENT";
        select.innerHTML = '<option value="Nouveau">Saisie libre dans les notes</option>';
    } else {
        label.innerText = "VÉHICULE CIBLÉ (STOCK)";
        const stockOptions = (window.savedDeals || [])
            .filter(d => d.status === "ACHETÉ")
            .map(d => `<option value="${d.model}">${d.model}</option>`)
            .join('');
        select.innerHTML = `<option value="">-- Choisir --</option>${stockOptions}<option value="Autre">Autre</option>`;
    }
};

// --- SAUVEGARDE AVEC AUTOMATISATION STRICTE ---
window.saveCustomer = function() {
    const type = document.getElementById('cust-type').value;
    const vehicleModel = document.getElementById('cust-vehicle').value;
    const name = document.getElementById('cust-name').value;

    if(!name) return alert("Le nom du client est requis");

    const data = {
        id: Date.now(),
        name: name,
        phone: document.getElementById('cust-phone').value,
        type: type,
        vehicle: vehicleModel,
        budget: document.getElementById('cust-budget').value,
        status: document.getElementById('cust-status').value,
        notes: document.getElementById('cust-notes').value,
        date: new Date().toLocaleDateString('fr-FR')
    };

    // LOGIQUE DE VENTE AUTOMATIQUE
    if ((type === "ACHAT" || type === "REPRISE") && vehicleModel && vehicleModel !== "Autre") {
        const vIdx = (window.savedDeals || []).findIndex(v => v.model === vehicleModel && v.status === "ACHETÉ");
        
        if (vIdx !== -1) {
            const v = window.savedDeals[vIdx];
            const p = prompt("Vente via CRM : Prix de vente final pour " + v.model + " :");
            if (p !== null && p !== "") {
                const d = prompt("Date de vente (AAAA-MM-JJ) :", new Date().toISOString().split('T')[0]);
                v.soldPrice = parseFloat(p); 
                v.date_out = d || new Date().toISOString();
                v.status = "VENDU";
                v.maintStep = "Vendu";

                localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
                data.status = "CONCLU";

                if (typeof window.updatePilotage === "function") window.updatePilotage();
                if (typeof window.renderMaintenance === "function") window.renderMaintenance();
            }
        }
    }

    // Sauvegarde client
    window.savedCustomers.push(data);
    localStorage.setItem('ox_customers', JSON.stringify(window.savedCustomers));
    
    // Fermeture propre de la modal
    const modal = document.getElementById('customer-modal');
    if(modal) modal.remove(); 
    
    window.renderCustomers();
};

// --- RENDU ET SYNCHRONISATION ---
window.renderCustomers = function() {
    const buyerList = document.getElementById('buyer-list');
    const sellerList = document.getElementById('seller-list');

    let nego = 0, buyersCount = 0, sellersCount = 0;
    window.savedCustomers.forEach(c => {
        if(c.status === "CHAUD") nego++;
        if(c.type === "ACHAT" || c.type === "REPRISE") buyersCount++;
        if(c.type === "VENTE") sellersCount++;
    });

    // MISE À JOUR SYNCHRONISÉE PARTOUT (ID DOUBLONS)
    const updateAll = (id, val) => {
        document.querySelectorAll(`[id="${id}"]`).forEach(el => el.innerText = val);
    };

    updateAll('crm-total', window.savedCustomers.length);
    updateAll('crm-nego', nego);
    updateAll('crm-buyers', buyersCount);
    updateAll('crm-sellers', sellersCount);

    if(!buyerList || !sellerList) return;

    const buildCard = (c, i) => `
        <div class="card" style="background:#1a1a1a; border-left: 4px solid ${c.type === 'VENTE' ? '#ef4444' : 'var(--success)'}; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:0.65rem; background:#333; padding:2px 8px; border-radius:10px;">${c.date}</span>
                <span style="font-size:0.7rem; color:${c.status === 'CHAUD' ? '#f59e0b' : (c.status === 'CONCLU' ? 'var(--success)' : '#aaa')}; font-weight:bold;">● ${c.status}</span>
            </div>
            
            <h3 style="margin:0; font-size:1.1rem; color:white;">${c.name}</h3>
            <p style="color:var(--accent); font-weight:bold; font-size:0.9rem; margin:5px 0;">
                ${c.vehicle ? '🚗 ' + c.vehicle : '🔍 Recherche libre'}
            </p>
            
            <div style="margin-top:10px; font-size:0.85rem;">
                <div style="margin-bottom:5px;">📞 <a href="tel:${c.phone}" style="color:white; text-decoration:none;">${c.phone || 'NC'}</a></div>
                <div style="background:#252525; padding:8px; border-radius:8px; font-style:italic; border:1px solid #333; font-size:0.8rem;">
                    "${c.notes || 'Pas de détails'}"
                </div>
            </div>

            <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.9rem;">${c.budget ? c.budget + ' €' : ''}</strong>
                <button onclick="window.deleteCustomer(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.75rem;">Supprimer</button>
            </div>
        </div>`;

    const buyersHTML = window.savedCustomers.map((c, i) => ({c, i})).filter(item => item.c.type !== "VENTE").reverse();
    const sellersHTML = window.savedCustomers.map((c, i) => ({c, i})).filter(item => item.c.type === "VENTE").reverse();

    buyerList.innerHTML = buyersHTML.length ? buyersHTML.map(item => buildCard(item.c, item.i)).join('') : '<p style="opacity:0.3; font-size:0.8rem;">Aucun acheteur</p>';
    sellerList.innerHTML = sellersHTML.length ? sellersHTML.map(item => buildCard(item.c, item.i)).join('') : '<p style="opacity:0.3; font-size:0.8rem;">Aucun vendeur</p>';
};

window.deleteCustomer = function(i) {
    if(confirm("Supprimer ce contact ?")) {
        window.savedCustomers.splice(i, 1);
        localStorage.setItem('ox_customers', JSON.stringify(window.savedCustomers));
        window.renderCustomers();
    }
};
// ==========================================================================
// TRESORIE
// ==========================================================================
window.savedExpenses = JSON.parse(localStorage.getItem('ox_expenses')) || [];

// --- FONCTION UTILITAIRE POUR NETTOYER LES CHIFFRES ---
// Transforme "17 000", "17.000" ou "17,000" en le nombre 17000
window.parseMoney = function(value) {
    if (!value) return 0;
    // On convertit en texte, on enlève les espaces, on remplace virgule par point
    const cleanStr = String(value).replace(/\s/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
};

// --- CALCULS ET RENDU ---
window.updateFinance = function() {
    const deals = window.savedDeals || [];
    const expenses = window.savedExpenses || [];
    
    // 1. Total des Charges (Loyer, Pub...)
    const totalExpenses = expenses.reduce((sum, e) => sum + window.parseMoney(e.amount), 0);
    
    // 2. Calcul de la Marge Brute (Ventes du mois uniquement)
    let totalBrutMarge = 0;
    
    deals.forEach(deal => {
        if (deal.status === "VENDU") {
            // Utilisation de parseMoney pour éviter les bugs d'espaces
            const purchase = window.parseMoney(deal.purchase);
            const fees = window.parseMoney(deal.fees);
            const sellingPrice = window.parseMoney(deal.soldPrice);
            
            // Somme des frais de réparation
            const repairs = (deal.interventions || []).reduce((s, i) => s + window.parseMoney(i.price), 0);
            
            // PRK (Prix de Revient Kilométrique / Total Coût)
            const prk = purchase + fees + repairs;
            
            // Marge Réelle = Prix Vente - Coût Total
            const margeVehicule = sellingPrice - prk;
            
            totalBrutMarge += margeVehicule;
        }
    });

    // 3. Fiscalité (TVA sur Marge)
    // NOTE : Je l'ai mise à 0 pour correspondre à ton calcul (7k - 2k = 5k).
    // Si tu veux réactiver la TVA, remplace 0 par : (totalBrutMarge > 0 ? totalBrutMarge * 0.20 : 0);
    const tva = 0; 
    
    // 4. Bénéfice Net Réel
    const netProfit = totalBrutMarge - tva - totalExpenses;

    // 5. Point Mort (Ce qu'il reste à faire)
    // Si Marge (7000) > Charges (2000), alors il reste 0 à faire.
    const missing = totalBrutMarge >= totalExpenses ? 0 : (totalExpenses - totalBrutMarge);
    
    // Barre de progression
    let progress = 0;
    if (totalExpenses > 0) {
        // Si on a couvert les charges, on est à 100%
        progress = totalBrutMarge >= totalExpenses ? 100 : (totalBrutMarge / totalExpenses) * 100;
        // On évite les barres négatives
        progress = Math.max(0, progress);
    } else if (totalBrutMarge > 0) {
        progress = 100; // Pas de charges mais du profit = 100%
    }

    // --- AFFICHAGE ---
    
    // A. Carte "Point Mort"
    const missingEl = document.getElementById('finance-missing-marge');
    if (missingEl) {
        if (missing === 0) {
            missingEl.innerText = "OBJECTIF ATTEINT !";
            missingEl.style.color = "#22c55e"; // Vert
            missingEl.style.fontSize = "1.5rem";
        } else {
            missingEl.innerText = missing.toLocaleString('fr-FR') + " €";
            missingEl.style.color = "white";
            missingEl.style.fontSize = "2.2rem";
        }
    }

    const bar = document.getElementById('break-even-bar');
    if (bar) {
        bar.style.width = progress + "%";
        bar.style.backgroundColor = progress >= 100 ? "#22c55e" : "var(--accent)";
    }

    const targetLabel = document.getElementById('finance-expense-total-label');
    if (targetLabel) targetLabel.innerText = `Objectif charges : ${totalExpenses.toLocaleString('fr-FR')} €`;

    // B. Carte "Fiscalité & Bénéfices"
    document.getElementById('finance-brut-marge').innerText = totalBrutMarge.toLocaleString('fr-FR') + " €";
    
    // Style conditionnel pour la marge (Rouge si négatif, Vert si positif)
    document.getElementById('finance-brut-marge').style.color = totalBrutMarge >= 0 ? "white" : "#ef4444";

    document.getElementById('finance-tva-total').innerText = tva.toLocaleString('fr-FR') + " €";
    
    const netEl = document.getElementById('finance-net-profit');
    if (netEl) {
        const prefix = netProfit > 0 ? "+ " : "";
        netEl.innerText = prefix + netProfit.toLocaleString('fr-FR') + " €";
        netEl.style.color = netProfit >= 0 ? "#22c55e" : "#ef4444";
    }

    // C. Footer (Bandeau du bas)
    const footerNet = document.querySelector('.bénéfice-estimé-val');
    if (footerNet) {
        const prefix = netProfit > 0 ? "+ " : "";
        footerNet.innerText = prefix + netProfit.toLocaleString('fr-FR') + " €";
        footerNet.style.color = netProfit >= 0 ? "#22c55e" : "#ef4444";
    }

    // D. Liste des charges
    const listEl = document.getElementById('expense-list');
    if (listEl) {
        listEl.innerHTML = expenses.map((e, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222; font-size:0.9rem;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="background:#333; padding:3px 8px; border-radius:4px; font-size:0.7rem; color:var(--accent);">${e.cat}</span>
                    <span style="color:white; font-weight:500;">${e.name.toUpperCase()}</span>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <strong style="color:white;">${window.parseMoney(e.amount).toLocaleString('fr-FR')} €</strong>
                    <button onclick="window.deleteExpense(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem;">&times;</button>
                </div>
            </div>
        `).join('') || '<p style="text-align:center; opacity:0.3; padding:20px;">Aucune charge enregistrée</p>';
    }

    const totalBadge = document.getElementById('total-expenses-badge');
    if (totalBadge) totalBadge.innerText = `Total : ${totalExpenses.toLocaleString('fr-FR')} €`;
};

// --- ACTIONS ---

window.addExpense = function() {
    const nameInput = document.getElementById('expense-name');
    const amountInput = document.getElementById('expense-amount');
    const catInput = document.getElementById('expense-cat');

    if (!nameInput.value || !amountInput.value) return alert("Remplissez tous les champs.");

    const newExpense = {
        id: Date.now(),
        name: nameInput.value,
        amount: window.parseMoney(amountInput.value), // Nettoyage immédiat
        cat: catInput.value,
        date: new Date().toLocaleDateString('fr-FR')
    };

    window.savedExpenses.push(newExpense);
    localStorage.setItem('ox_expenses', JSON.stringify(window.savedExpenses));
    
    nameInput.value = '';
    amountInput.value = '';
    
    window.updateFinance();
};

window.deleteExpense = function(idx) {
    if (confirm("Supprimer cette charge ?")) {
        window.savedExpenses.splice(idx, 1);
        localStorage.setItem('ox_expenses', JSON.stringify(window.savedExpenses));
        window.updateFinance();
    }
};

// ==========================================================================
// ADMIN & LEGAL
// ==========================================================================

// ==========================================
// SYSTÈME DE COMPTABILITÉ OX PRO - FIX FINAL
// ==========================================

window.updateAccountingPreview = function() {
    console.log("Calcul Compta lancé...");
    
    const mSelect = document.getElementById('export-month');
    const ySelect = document.getElementById('export-year');
    if (!mSelect || !ySelect) return;

    // On récupère les valeurs choisies par l'utilisateur
    const selMonth = parseInt(mSelect.value); // 0 pour Janvier, 1 pour Février...
    const selYear = parseInt(ySelect.value);

    let totalCA = 0;
    let totalMarge = 0;

    const data = JSON.parse(localStorage.getItem('ox_history')) || [];

    data.forEach(v => {
        try {
            // Condition 1 : Il faut que le statut soit VENDU
            if (v.status === "VENDU") {
                
                // On récupère la date (soit "2026-02-23" soit "23/02/2026")
                const dRaw = v.date_out || v.date || "";
                let vMonth = -1;
                let vYear = -1;

                if (dRaw.includes('-')) {
                    const parts = dRaw.split('-');
                    vYear = parseInt(parts[0]);
                    vMonth = parseInt(parts[1]) - 1;
                } else if (dRaw.includes('/')) {
                    const parts = dRaw.split('/');
                    vYear = parseInt(parts[2]);
                    vMonth = parseInt(parts[1]) - 1;
                }

                // Affichage debug pour voir ce qui bloque
                console.log(`Véhicule: ${v.model}, Mois détecté: ${vMonth}, Année détectée: ${vYear}`);

                // Comparaison avec les menus déroulants
                if (vMonth === selMonth && vYear === selYear) {
                    const vente = parseFloat(v.soldPrice) || 0;
                    const achat = parseFloat(v.purchase) || 0;
                    const frais = parseFloat(v.repairs || 0) + parseFloat(v.fees || 0);
                    
                    totalCA += vente;
                    totalMarge += (vente - (achat + frais));
                }
            }
        } catch (e) {
            console.error("Erreur sur un véhicule:", e);
        }
    });

    // MISE À JOUR FORCÉE DE L'INTERFACE
    const format = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    
    const elCA = document.getElementById('preview-ca');
    const elMarge = document.getElementById('preview-marge');
    const elTVA = document.getElementById('preview-tva');

    if (elCA) elCA.innerHTML = `<strong>${format(totalCA)}</strong>`;
    if (elMarge) {
        elMarge.innerHTML = `<strong>${format(totalMarge)}</strong>`;
        elMarge.style.color = totalMarge >= 0 ? "#22c55e" : "#ef4444";
    }
    if (elTVA) {
        const tva = totalMarge > 0 ? totalMarge * 0.20 : 0;
        elTVA.innerHTML = `<strong>${format(tva)}</strong>`;
    }
};

// On force l'exécution au chargement et sur chaque clic dans la page
document.addEventListener('click', window.updateAccountingPreview);
document.addEventListener('change', window.updateAccountingPreview);
window.updateAccountingPreview();

// ==========================================
// SYSTÈME DE REPORTING OX PRO
// ==========================================

window.generateProReport = function() {
    // 1. CONFIGURATION DU GARAGE
    const config = {
        nom: "OX PRO AUTOMOBILE",
        adresse: "123 Avenue du Business, 75000 Paris",
        contact: "01 23 45 67 89 | contact@oxpro-auto.fr",
        siret: "888 777 666 00012",
        logo: "https://via.placeholder.com/150x50?text=OX+PRO+LOGO" // Remplace par ton URL d'image
    };

    const mSelect = document.getElementById('export-month');
    const ySelect = document.getElementById('export-year');
    const monthName = mSelect.options[mSelect.selectedIndex].text;
    const year = ySelect.value;

    const data = JSON.parse(localStorage.getItem('ox_history')) || [];
    let stats = { ca: 0, achat: 0, frais: 0, marge: 0, ventes: 0 };
    let rows = "";

    const clean = (v) => {
        if (!v) return 0;
        let c = v.toString().replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
        return parseFloat(c) || 0;
    };

    // 2. ANALYSE DES DONNÉES
    data.forEach(v => {
        if (v.status === "VENDU") {
            const dateStr = v.date_out || "";
            const p = dateStr.split('-');
            if (parseInt(p[0]) === parseInt(year) && (parseInt(p[1]) - 1) === parseInt(mSelect.value)) {
                const pV = clean(v.soldPrice);
                const pA = clean(v.purchase);
                const pF = clean(v.repairs) + clean(v.fees);
                const m = pV - (pA + pF);

                stats.ca += pV; stats.achat += pA; stats.frais += pF; stats.marge += m;
                stats.ventes++;

                rows += `
                    <tr>
                        <td>${dateStr.split('-').reverse().join('/')}</td>
                        <td>
                            <div style="font-weight:700;">${v.brand} ${v.model}</div>
                            <div style="font-size:10px; color:#666;">VIN: ${v.vin || 'N/C'} | Immat: ${v.plate || 'N/C'}</div>
                        </td>
                        <td>${pA.toLocaleString()} €</td>
                        <td>${pF.toLocaleString()} €</td>
                        <td>${pV.toLocaleString()} €</td>
                        <td style="font-weight:bold; color:${m >= 0 ? '#10b981' : '#ef4444'}">${m.toLocaleString()} €</td>
                    </tr>`;
            }
        }
    });

    // Calculs d'initiatives
    const margeMoyenne = stats.ventes > 0 ? (stats.marge / stats.ventes).toFixed(0) : 0;
    const tvaSurMarge = stats.marge > 0 ? stats.marge * 0.20 : 0;

    // 3. CRÉATION DU DOCUMENT INDÉPENDANT
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>OX_PRO_${monthName}_${year}</title>
            <style>
                body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 40px; line-height: 1.4; }
                @page { size: A4; margin: 10mm; }
                
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
                .garage-brand { display: flex; align-items: center; gap: 15px; }
                .garage-brand img { max-height: 50px; }
                .info { font-size: 11px; color: #475569; }

                .doc-meta { text-align: right; }
                .doc-meta h1 { margin: 0; color: #f97316; font-size: 24px; font-weight: 800; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-card label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; }
                .stat-card div { font-size: 16px; font-weight: 800; margin-top: 5px; }

                .kpi-row { background: #1e293b; color: white; padding: 10px 20px; border-radius: 6px; display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; }

                table { width: 100%; border-collapse: collapse; }
                th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
                td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
                
                .signature-area { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
                .sig-box { border: 1px dashed #cbd5e1; height: 100px; padding: 10px; border-radius: 8px; font-size: 10px; color: #94a3b8; }

                .no-print { position: fixed; top: 20px; right: 20px; background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <button class="no-print" onclick="window.print()">📥 GÉNÉRER LE PDF</button>

            <div class="header">
                <div class="garage-brand">
                    <img src="${config.logo}" alt="Logo">
                    <div class="info">
                        <strong>${config.nom}</strong><br>
                        ${config.adresse}<br>
                        ${config.contact}<br>
                        SIRET: ${config.siret}
                    </div>
                </div>
                <div class="doc-meta">
                    <h1>RAPPORT DE CLÔTURE</h1>
                    <div style="font-weight: 700;">${monthName.toUpperCase()} ${year}</div>
                    <div style="font-size: 10px; color: #94a3b8;">Document ID: OX-${year}-${mSelect.value}</div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card"><label>Chiffre d'Affaires</label><div>${stats.ca.toLocaleString()} €</div></div>
                <div class="stat-card"><label>Achats Net</label><div>${stats.achat.toLocaleString()} €</div></div>
                <div class="stat-card"><label>Marge Brute</label><div style="color:#10b981">${stats.marge.toLocaleString()} €</div></div>
                <div class="stat-card"><label>TVA sur Marge</label><div>${tvaSurMarge.toLocaleString()} €</div></div>
            </div>

            <div class="kpi-row">
                <span>Ventes totales : <strong>${stats.ventes} véhicules</strong></span>
                <span>Marge moyenne / véhicule : <strong>${margeMoyenne} €</strong></span>
                <span>Rentabilité globale : <strong>${stats.ca > 0 ? ((stats.marge/stats.ca)*100).toFixed(1) : 0}%</strong></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Désignation Véhicule</th>
                        <th>Achat</th>
                        <th>Frais</th>
                        <th>Vente</th>
                        <th>Marge brute</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="6" style="text-align:center; padding:30px;">Aucun véhicule vendu sur cette période.</td></tr>'}
                </tbody>
            </table>

            <div class="signature-area">
                <div>
                    <div style="font-size:11px; font-weight:bold; margin-bottom:5px;">Commentaires / Notes :</div>
                    <div class="sig-box"></div>
                </div>
                <div>
                    <div style="font-size:11px; font-weight:bold; margin-bottom:5px;">Cachet et Signature Direction :</div>
                    <div class="sig-box"></div>
                </div>
            </div>

            <div style="margin-top:40px; text-align:center; font-size:9px; color:#cbd5e1;">
                OX PRO AUTOMOBILE - Logiciel de gestion certifié. Généré le ${new Date().toLocaleString()}
            </div>
        </body>
        </html>
    `);
    reportWindow.document.close();
};

// 2. GESTION DU LIVRE DE POLICE (CORRIGÉ)
// ==========================================

window.updatePoliceTable = function() {
    const tbody = document.getElementById('police-table-body');
    if (!tbody) return;

    // Inversion pour voir les derniers ajouts en haut
    const displayDeals = [...window.savedDeals].reverse();

    tbody.innerHTML = displayDeals.map((deal, index) => {
        const isSold = deal.status === "VENDU";
        
        // Sécurité pour les documents
        const hasCG = deal.file_cg ? '✅' : '❌';
        const hasCession = deal.file_cession ? '✅' : '❌';

        return `
            <tr style="border-bottom:1px solid #222; background: ${isSold ? 'rgba(34, 197, 94, 0.05)' : 'transparent'};">
                <td style="padding:12px; color:#888;">#${deal.id ? String(deal.id).slice(-6) : index + 1}</td>
                <td style="padding:12px;">${deal.date_buy || deal.date || "NC"}</td>
                <td style="padding:12px;">
                    <strong>${deal.brand || ""} ${deal.model || "Véhicule"}</strong><br>
                    <small style="color:var(--accent); font-weight:bold;">${deal.immat || "SANS IMMAT"}</small>
                </td>
                <td style="padding:12px; font-size:0.85rem;">${deal.sellerName || deal.provenance || "Particulier"}</td>
                <td style="padding:12px;">${isSold ? (deal.saleDate || deal.date_out || "-") : '<span style="color:#f59e0b; font-size:0.75rem;">📦 EN STOCK</span>'}</td>
                <td style="padding:12px;">${isSold ? (deal.buyerName || "Client") : "-"}</td>
                <td style="padding:12px; text-align:right;">
                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                        <button onclick="window.manageFiles('${deal.id}')" title="CG: ${hasCG} | Cess: ${hasCession}" style="background:#222; border:1px solid #444; color:white; padding:6px; border-radius:6px; cursor:pointer;">📁 Docs</button>
                        <button onclick="window.generateInvoice('${deal.id}')" style="background:var(--success); border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold;">📄 Facture</button>
                        <button onclick="window.editPoliceEntry('${deal.id}')" style="background:none; border:1px solid #333; color:#888; padding:6px; border-radius:6px; cursor:pointer;">Mdf</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

// ==========================================
// 3. AUTO-COMPLÉTION ET AJOUT MANUEL
// ==========================================

window.updatePoliceTable = function() {
    const tableBody = document.getElementById('police-table-body');
    if (!tableBody) return;

    const data = window.savedDeals || [];
    
    tableBody.innerHTML = data.map((v, index) => {
        // 1. Sécurité pour la DATE D'ENTRÉE (Achat)
        // On cherche dans toutes les clés possibles que ton système pourrait utiliser
        const dateEntree = v.date_in || v.date_buy || v.purchase_date || v.date || 'Non renseignée';

        // 2. Calculs financiers
        const purchase = parseFloat(v.purchase) || 0;
        const repairs = parseFloat(v.repairs) || 0;
        const fees = parseFloat(v.fees) || 0;
        const prk = purchase + repairs + fees;
        const soldPrice = parseFloat(v.soldPrice) || 0;

        // 3. Détection de l'origine
        const isPro = (v.seller_name || "").toLowerCase().match(/garage|sarl|sas|auto|negoce/);
        const origineType = isPro ? "🏢 PRO" : "👤 PART";

        return `
            <tr style="border-bottom: 1px solid #222; color: #eee;">
                <td style="padding:12px;">${index + 1}</td>
                
                <td style="padding:12px; color: #34d399; font-weight: bold;">
                    ${dateEntree}
                </td>
                
                <td style="padding:12px;">
                    <strong style="color:var(--accent); font-size:0.9rem; letter-spacing:1px;">
                        ${v.plate || v.immat || 'NC'}
                    </strong>
                </td>
                
                <td style="padding:12px;">
                    <div style="font-weight:bold; color:white;">${v.brand || ''} ${v.model || ''}</div>
                    <div style="font-size:0.75rem; color:#aaa;">${v.km ? v.km.toLocaleString() : '0'} KM</div>
                </td>
                
                <td style="padding:12px;">
                    <div style="font-size:0.7rem; color:#888; margin-bottom:2px;">${origineType}</div>
                    <div style="text-transform:uppercase; font-size:0.8rem;">${v.seller_name || 'NC'}</div>
                </td>
                
                <td style="padding:12px;">
                    <div style="font-weight:bold;">${purchase.toLocaleString()} €</div>
                    <div style="font-size:0.7rem; color:var(--accent);">PRK: ${prk.toLocaleString()} €</div>
                </td>
                
                <td style="padding:12px;">
                    <div style="font-weight:bold; color:#fff;">${v.buyer_name || (v.status === 'VENDU' ? 'Inconnu' : 'EN STOCK')}</div>
                    <div style="font-size:0.75rem; color:#666;">${v.date_out || '-'}</div>
                </td>
                
                <td style="padding:12px;">
                    <button onclick="window.generateInvoice('${v.id}')" 
                            style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:bold;">
                        📄 FACTURE
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};
// ==========================================
// 4. GESTION DES FICHIERS (BASE64)
// ==========================================

window.manageFiles = function(dealId) {
    const deal = window.savedDeals.find(d => d.id == dealId);
    if(!deal) return;

    const modalHTML = `
    <div id="file-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
        <div class="card" style="width:450px; padding:25px; background:#1a1a1a; border:1px solid #333; border-radius:15px; color:white;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">📁 Documents : ${deal.model}</h3>
                <button onclick="document.getElementById('file-modal').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            <div style="background:#222; padding:15px; border-radius:10px; margin-bottom:15px; border:1px dashed #444;">
                <label style="display:block; font-size:0.75rem; color:var(--accent); margin-bottom:8px; font-weight:bold;">CARTE GRISE (SCAN/PHOTO)</label>
                <input type="file" id="file-cg" onchange="window.saveFile('${dealId}', 'cg')" style="font-size:0.8rem; width:100%;">
                ${deal.file_cg ? '<p style="color:#22c55e; font-size:0.75rem; margin-top:5px;">✅ Fichier enregistré</p>' : '<p style="color:#ef4444; font-size:0.75rem; margin-top:5px;">⚠️ Manquant</p>'}
            </div>
            <div style="background:#222; padding:15px; border-radius:10px; margin-bottom:20px; border:1px dashed #444;">
                <label style="display:block; font-size:0.75rem; color:var(--accent); margin-bottom:8px; font-weight:bold;">CERTIFICAT DE CESSION</label>
                <input type="file" id="file-cession" onchange="window.saveFile('${dealId}', 'cession')" style="font-size:0.8rem; width:100%;">
                ${deal.file_cession ? '<p style="color:#22c55e; font-size:0.75rem; margin-top:5px;">✅ Fichier enregistré</p>' : '<p style="color:#ef4444; font-size:0.75rem; margin-top:5px;">⚠️ Manquant</p>'}
            </div>
            <button onclick="document.getElementById('file-modal').remove()" style="width:100%; padding:12px; background:var(--accent); border:none; color:white; border-radius:8px; cursor:pointer; font-weight:bold;">Terminer</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.saveFile = function(dealId, type) {
    const input = document.getElementById(type === 'cg' ? 'file-cg' : 'file-cession');
    const file = input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const index = window.savedDeals.findIndex(d => d.id == dealId);
        if(index !== -1) {
            window.savedDeals[index]['file_' + type] = e.target.result;
            localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
            alert("Document " + (type === 'cg' ? 'Carte Grise' : 'Cession') + " mis à jour !");
            document.getElementById('file-modal').remove();
            window.updatePoliceTable();
        }
    };
    reader.readAsDataURL(file);
};

// ==========================================
// 5. GÉNÉRATION DE FACTURE PRO & INTERACTIVE
// ==========================================
window.getProfileData = function() {
    const saved = JSON.parse(localStorage.getItem('ox_profile_settings'));
    
    // Si rien n'est enregistré, on met des valeurs par défaut pour ne pas laisser de blanc
    return {
        name: saved?.companyName || "VOTRE ENTREPRISE",
        addr: saved?.address || "ADRESSE NON RENSEIGNÉE",
        siret: saved?.siret || "SIRET MANQUANT",
        tva: saved?.tvaIntra || "TVA NON RENSEIGNÉE",
        contact: (saved?.phone || "") + " " + (saved?.email || "")
    };
};

// EXEMPLE d'utilisation pour générer l'en-tête de ta facture
window.generateInvoiceHeader = function() {
    const info = window.getProfileData(); // On récupère les infos profil
    
    return `
        <div class="invoice-header">
            <h1>${info.name}</h1>
            <p>${info.addr}</p>
            <p>SIRET: ${info.siret} | TVA: ${info.tva}</p>
            <p>${info.contact}</p>
        </div>
    `;
};

window.generateInvoice = function(dealId) {
    const deal = window.savedDeals.find(d => d.id == dealId);
    if(!deal) return alert("Véhicule introuvable");

    // --- RECHERCHE ET PRÉREMPLISSAGE DU CLIENT (Blindé) ---
    // On cherche toutes les appellations possibles dans ton système
    let clientName = deal.buyerName || deal.buyer_name || deal.acheteur || "M. / Mme Client";
    let buyerAddress = deal.buyerAddress || deal.buyer_address || deal.adresse || "...";
    let buyerPhone = deal.buyerPhone || deal.buyer_phone || deal.telephone || "";

    // Si l'adresse n'est pas trouvée directement, on fouille le CRM
    if ((buyerAddress === "..." || !buyerAddress) && clientName !== "M. / Mme Client" && window.savedCustomers) {
        const customer = window.savedCustomers.find(c => 
            c.name && clientName && c.name.toLowerCase().trim() === clientName.toLowerCase().trim()
        );
        if (customer) {
            buyerPhone = customer.phone || customer.telephone || buyerPhone;
            // On vérifie si l'adresse est dans les notes (format 📍) ou le champ adresse
            if (customer.notes && customer.notes.includes('📍')) {
                buyerAddress = customer.notes.split('📍')[1].trim();
            } else {
                buyerAddress = customer.address || customer.adresse || buyerAddress;
            }
        }
    }

    const profile = window.getProfileData(); 
    const savedSettings = JSON.parse(localStorage.getItem('ox_profile_settings')) || {};
    const logoUrl = savedSettings.logoUrl || "";

    const win = window.open('', '_blank');
    
    win.document.write(`
        <html><head><title>Facture_${deal.model || 'Vehicule'}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; position: relative; }
            .ox-badge { position: absolute; top: 10px; right: 40px; font-size: 0.7rem; color: #ccc; font-weight: bold; letter-spacing: 1px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { max-width: 200px; max-height: 80px; margin-bottom: 10px; }
            .logo-area img { max-width: 100%; height: auto; }
            .box { margin: 20px 0; display: flex; justify-content: space-between; gap: 40px; }
            .client-box, .garage-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; flex: 1; background: #fafafa; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 12px; }
            .total-section { text-align: right; margin-top: 40px; }
            .total-amount { font-size: 2.2rem; font-weight: bold; color: #000; border-top: 2px solid #000; display: inline-block; padding-top: 10px; }
            .footer { margin-top: 80px; font-size: 0.8rem; color: #666; border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
            .no-print { display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 12px; border: 1px solid #e9ecef; }
            .btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; border: none; }
            .btn-add { background: #495057; color: white; }
            .btn-print { background: #000; color: white; }
            .cachet-area { margin-top: 40px; display: flex; justify-content: flex-end; }
            .cachet-box { border: 1px dashed #ccc; width: 250px; height: 120px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 0.75rem; text-align: center; border-radius: 8px; }
            [contenteditable="true"]:hover { background: #fffde7; outline: 1px dashed #ffd600; }
            @media print { .no-print { display: none !important; } }
        </style></head>
        <body>
            <div class="ox-badge">LOGICIEL OX PRO</div>

            <div class="no-print">
                <button class="btn btn-add" onclick="addNewLine()">➕ Ajouter une ligne</button>
                <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer la facture</button>
            </div>

            <div class="header">
                <div>
                    ${logoUrl ? `<div class="logo-area"><img src="${logoUrl}" alt="Logo"></div>` : ''}
                    <h1 style="margin:0; font-size:2.5rem; color:#000;">FACTURE</h1>
                    <p>Référence : <span contenteditable="true">INV-${deal.id}</span></p>
                    <p>Date : <span contenteditable="true">${deal.saleDate || deal.date_out || new Date().toLocaleDateString('fr-FR')}</span></p>
                </div>
                <div style="text-align:right">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #22c55e;">${profile.name}</div>
                    <small>Auto-entrepreneur / Garage</small>
                </div>
            </div>
            
            <div class="box">
                <div class="garage-box">
                    <strong style="color:#555; font-size:0.75rem; text-transform:uppercase;">Vendeur</strong><br>
                    <div contenteditable="true">
                        <strong>${profile.name}</strong><br>
                        ${profile.addr}<br>
                        ${profile.contact}<br>
                        SIRET: ${profile.siret}<br>
                        TVA: ${profile.tva}
                    </div>
                </div>
                <div class="client-box">
                    <strong style="color:#555; font-size:0.75rem; text-transform:uppercase;">Facturé à</strong><br>
                    <div contenteditable="true">
                        <strong>${clientName}</strong><br>
                        ${buyerPhone ? 'Tél : ' + buyerPhone + '<br>' : ''}
                        Adresse : ${buyerAddress !== "..." ? buyerAddress : "À compléter..."}<br>
                        Détails : ${deal.notes || "Vente Véhicule Occasion"}
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th style="width: 150px;">Immatriculation</th>
                        <th style="width: 150px; text-align: right;">Prix Net TTC</th>
                    </tr>
                </thead>
                <tbody id="invoice-body">
                    <tr>
                        <td contenteditable="true">
                            <strong style="font-size:1.1rem;">${deal.brand || deal.marque || ''} ${deal.model || deal.modele || ''}</strong><br>
                            Kilométrage : ${deal.km || 'NC'} km | Immatriculation : ${deal.immat || deal.plate || deal.immatriculation || 'Non renseignée'}
                        </td>
                        <td contenteditable="true" style="font-weight:bold;">${deal.immat || deal.plate || deal.immatriculation || 'A COMPLÉTER'}</td>
                        <td style="text-align: right;">
                            <span contenteditable="true" class="price-val" onblur="updateTotal()">${deal.soldPrice || deal.prix_vente || 0}</span> €
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <p style="margin:0; font-size: 0.9rem;">TOTAL À PAYER</p>
                <div class="total-amount"><span id="total-val">${(deal.soldPrice || deal.prix_vente || 0).toLocaleString('fr-FR')}</span> €</div>
            </div>

            <div class="cachet-area">
                <div class="cachet-box">Cachet commercial<br>et signature du vendeur</div>
            </div>

            <div class="footer">
                <p>Facture générée par le logiciel <strong>OX PRO</strong> pour <strong>${profile.name}</strong></p>
                <p style="font-size:0.7rem;">TVA sur marge récupérable (Art. 297 A du CGI). Véhicule vendu en l'état.</p>
            </div>

            <script>
                function addNewLine() {
                    const tbody = document.getElementById('invoice-body');
                    const row = document.createElement('tr');
                    row.innerHTML = '<td contenteditable="true">Prestation supplémentaire...</td><td contenteditable="true">--</td><td style="text-align: right;"><span contenteditable="true" class="price-val" onblur="updateTotal()">0</span> €</td>';
                    tbody.appendChild(row);
                }
                function updateTotal() {
                    let total = 0;
                    document.querySelectorAll('.price-val').forEach(p => {
                        let val = p.innerText.replace(/[^0-9.,]/g, '').replace(',', '.');
                        total += parseFloat(val) || 0;
                    });
                    document.getElementById('total-val').innerText = total.toLocaleString('fr-FR');
                }
            </script>
        </body></html>
    `);
    win.document.close();
};
// ==========================================
// 6. MODIFICATION ET COMPTABILITÉ
// ==========================================

window.editPoliceEntry = function(dealId) {
    const index = window.savedDeals.findIndex(d => d.id == dealId);
    if (index === -1) return;
    const deal = window.savedDeals[index];

    const nBrand = prompt("Marque :", deal.brand);
    const nModel = prompt("Modèle :", deal.model);
    const nImmat = prompt("Immatriculation :", deal.immat);
    const nPrice = prompt("Prix de vente final (€) :", deal.soldPrice);
    const nClient = prompt("Nom du client :", deal.buyerName);

    if (nBrand !== null) window.savedDeals[index].brand = nBrand;
    if (nModel !== null) window.savedDeals[index].model = nModel;
    if (nImmat !== null) window.savedDeals[index].immat = nImmat.toUpperCase();
    if (nPrice !== null) window.savedDeals[index].soldPrice = parseFloat(nPrice);
    if (nClient !== null) window.savedDeals[index].buyerName = nClient;

    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    window.updatePoliceTable();
};

window.openHistovec = function() {
    window.open('https://histovec.interieur.gouv.fr/histovec/accueil', '_blank');
};

// ==========================================
// GESTION DE LA CLÔTURE MENSUELLE
// ==========================================

window.updateAccountingPreview = function() {
    // Récupération des sélecteurs de la carte "Clôture Mensuelle"
    const mSelect = document.getElementById('export-month');
    const ySelect = document.getElementById('export-year');
    
    if(!mSelect || !ySelect) return;

    // Valeurs cibles (ex: "1" pour Février, "2026")
    const targetMonth = parseInt(mSelect.value); 
    const targetYear = parseInt(ySelect.value);
    
    let totalCA = 0;
    let totalMarge = 0;

    // Parcours de tous les véhicules enregistrés
    window.savedDeals.forEach(deal => {
        // On ne calcule que les véhicules marqués comme "VENDU"
        if (deal.status === "VENDU") {
            // On récupère la date de vente (saleDate ou date_out selon ton format)
            const dateStr = deal.saleDate || deal.date_out;
            
            if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                // Format attendu JJ/MM/AAAA -> parts[1] est le mois
                const saleMonth = parseInt(parts[1]) - 1; // -1 car Janvier = 0 en JavaScript
                const saleYear = parseInt(parts[2]);

                // Comparaison avec la sélection de l'interface
                if (saleMonth === targetMonth && saleYear === targetYear) {
                    const prixVente = window.toNum(deal.soldPrice);
                    const fraisTotaux = window.toNum(deal.buyPrice) + window.toNum(deal.totalFrais || deal.fees);
                    
                    totalCA += prixVente;
                    totalMarge += (prixVente - fraisTotaux);
                }
            }
        }
    });

    // Mise à jour de l'affichage dans les balises de la carte "Clôture Mensuelle"
    const formatEuro = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    if(document.getElementById('preview-ca')) {
        document.getElementById('preview-ca').innerText = formatEuro(totalCA);
    }
    if(document.getElementById('preview-marge')) {
        // Affiche la marge en vert si positive, rouge si négative
        const elMarge = document.getElementById('preview-marge');
        elMarge.innerText = formatEuro(totalMarge);
        elMarge.style.color = totalMarge >= 0 ? "#22c55e" : "#ef4444";
    }
    if(document.getElementById('preview-tva')) {
        // Calcul de la TVA sur marge (20%) si la marge est positive
        const tva = totalMarge > 0 ? totalMarge * 0.20 : 0;
        document.getElementById('preview-tva').innerText = formatEuro(tva);
    }
};

// Liaison des événements de changement sur les menus déroulants
const mSel = document.getElementById('export-month');
const ySel = document.getElementById('export-year');
if(mSel) mSel.onchange = window.updateAccountingPreview;
if(ySel) ySel.onchange = window.updateAccountingPreview;


window.openFactureVierge = function() {
    // Récupération des données via ta fonction de profil officielle
    const profile = window.getProfileData(); 
    
    // Récupération du logo (si existant)
    const savedSettings = JSON.parse(localStorage.getItem('ox_profile_settings')) || {};
    const logoUrl = savedSettings.logoUrl || ""; 

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Facture_Vierge_OX_PRO</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; position: relative; }
            .ox-badge { position: absolute; top: 10px; right: 40px; font-size: 0.7rem; color: #ccc; font-weight: bold; letter-spacing: 1px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { max-width: 200px; max-height: 80px; margin-bottom: 10px; }
            .logo-area img { max-width: 100%; height: auto; }
            .box { margin: 20px 0; display: flex; justify-content: space-between; gap: 40px; }
            .client-box, .garage-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; flex: 1; background: #fafafa; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; text-transform: uppercase; font-size: 0.8rem; }
            td { border: 1px solid #ddd; padding: 12px; }
            .total-section { text-align: right; margin-top: 40px; }
            .total-amount { font-size: 2.2rem; font-weight: bold; color: #000; border-top: 2px solid #000; display: inline-block; padding-top: 10px; }
            .footer { margin-top: 80px; font-size: 0.8rem; color: #666; border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
            .no-print { display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 12px; border: 1px solid #e9ecef; }
            .btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; border: none; }
            .btn-add { background: #495057; color: white; }
            .btn-print { background: #000; color: white; }
            .cachet-area { margin-top: 40px; display: flex; justify-content: flex-end; }
            .cachet-box { border: 1px dashed #ccc; width: 250px; height: 120px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 0.75rem; text-align: center; border-radius: 8px; }
            [contenteditable="true"]:hover { background: #fffde7; outline: 1px dashed #ffd600; }
            @media print { .no-print { display: none !important; } }
        </style></head>
        <body>
            <div class="ox-badge">LOGICIEL OX PRO</div>

            <div class="no-print">
                <button class="btn btn-add" onclick="addNewLine()">➕ Ajouter une ligne</button>
                <button class="btn btn-print" onclick="window.print()">🖨️ IMPRIMER LA FACTURE</button>
            </div>

            <div class="header">
                <div>
                    ${logoUrl ? `<div class="logo-area"><img src="${logoUrl}" alt="Logo"></div>` : ''}
                    <h1 style="margin:0; font-size:2.5rem; color:#000;">FACTURE</h1>
                    <p>Référence : <span contenteditable="true">INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}</span></p>
                    <p>Date : <span contenteditable="true">${new Date().toLocaleDateString('fr-FR')}</span></p>
                </div>
                <div style="text-align:right">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #22c55e;">${profile.name}</div>
                    <small>Auto-entrepreneur / Garage</small>
                </div>
            </div>
            
            <div class="box">
                <div class="garage-box">
                    <strong style="color:#555; font-size:0.75rem; text-transform:uppercase;">Vendeur</strong><br>
                    <div contenteditable="true">
                        <strong>${profile.name}</strong><br>
                        ${profile.addr}<br>
                        ${profile.contact}<br><br>
                        SIRET: ${profile.siret}<br>
                        TVA: ${profile.tva}
                    </div>
                </div>
                <div class="client-box">
                    <strong style="color:#555; font-size:0.75rem; text-transform:uppercase;">Facturé à</strong><br>
                    <div contenteditable="true" style="min-height: 100px;">
                        <strong>Nom du Client</strong><br>
                        Adresse : <br>
                        CP / Ville : 
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th style="width: 180px;">Détails (VIN/Immat)</th>
                        <th style="width: 150px; text-align: right;">Prix Net TTC</th>
                    </tr>
                </thead>
                <tbody id="invoice-body">
                    <tr>
                        <td contenteditable="true"><strong>Vente de véhicule d'occasion</strong></td>
                        <td contenteditable="true">Immat : <br>KM : </td>
                        <td style="text-align: right;">
                            <span contenteditable="true" class="price-val" onblur="updateTotal()">0.00</span> €
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <p style="margin:0; font-size: 0.9rem; font-weight: bold;">TOTAL À PAYER</p>
                <div class="total-amount"><span id="total-val">0,00</span> €</div>
            </div>

            <div class="cachet-area">
                <div class="cachet-box">Cachet commercial<br>et signature du vendeur</div>
            </div>

            <div class="footer">
                <p>Facture générée par le logiciel <strong>OX PRO</strong> pour <strong>${profile.name}</strong></p>
                <p style="font-size:0.7rem; color: #999;">
                    TVA sur marge récupérable (Art. 297 A du CGI). Véhicule vendu en l'état sans garantie contractuelle sauf mention contraire.
                </p>
            </div>

            <script>
                function addNewLine() {
                    const tbody = document.getElementById('invoice-body');
                    const row = document.createElement('tr');
                    row.innerHTML = '<td contenteditable="true">Prestation supplémentaire...</td><td contenteditable="true">--</td><td style="text-align: right;"><span contenteditable="true" class="price-val" onblur="updateTotal()">0.00</span> €</td>';
                    tbody.appendChild(row);
                }
                function updateTotal() {
                    let total = 0;
                    document.querySelectorAll('.price-val').forEach(p => {
                        let val = p.innerText.replace(/\\s/g, '').replace(',', '.');
                        total += parseFloat(val) || 0;
                    });
                    document.getElementById('total-val').innerText = total.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                }
            </script>
        </body></html>
    `);
    win.document.close();
};

// ==========================================
// 7. INITIALISATION AUTO
// ==========================================

window.updateAdmin = function() {
    window.updatePoliceTable();
    window.updateAccountingPreview();
};

// OPTION : ACTIVATION DES BOUTONS SANS MODIFIER LE HTML
document.addEventListener('DOMContentLoaded', function() {
    // On cherche tous les boutons de la page
    const allButtons = document.querySelectorAll('button');

    allButtons.forEach(btn => {
        // Relier le bouton "Facture Vierge"
        if (btn.innerText.includes('Facture Vierge')) {
            btn.onclick = window.openFactureVierge;
        }
        
        // Relier le bouton "Imprimer" (Registre de police)
        if (btn.innerText.includes('IMPRIMER')) {
            btn.onclick = function() { window.print(); };
        }
    });

    // Relier les menus déroulants du CA
    const mSel = document.getElementById('export-month');
    const ySel = document.getElementById('export-year');
    if(mSel) mSel.addEventListener('change', window.updateAccountingPreview);
    if(ySel) ySel.addEventListener('change', window.updateAccountingPreview);
});


// ==========================================================================
// SYSTÈME HISTORIQUE OX PRO - VERSION INTÉGRALE
// ==========================================================================

window.updateHistory = function(filterType = 'all') {
    const feed = document.getElementById('history-feed');
    if (!feed) return;

    // Récupération sécurisée des données
    const deals = JSON.parse(localStorage.getItem('ox_history')) || [];
    const searches = JSON.parse(localStorage.getItem('ox_searches')) || [];
    let events = [];

    // 1. TRAITEMENT DES DOSSIERS (Achats / Ventes / Stock)
    deals.forEach(v => {
        const nom = (v.brand && v.brand !== "undefined" ? v.brand + " " : "") + (v.model || "Véhicule");
        const immat = v.plate || v.vin || "SANS IMMAT";
        const kms = (v.km && v.km !== "0" && v.km !== "") ? v.km + " KM" : "⚠️ KM à saisir";
        
        // Détermination du type pour le filtrage
        const statusBrut = (v.status || "").toUpperCase().trim();
        let type = 'search'; // Par défaut "En attente"
        
        if (statusBrut === "VENDU") {
            type = 'sell';
        } else if (statusBrut === "EN STOCK" || statusBrut === "STOCK" || v.purchase > 0) {
            type = 'buy'; // Considéré comme Achat/Stock
        }

        events.push({
            id: v.id,
            type: type, // 'buy', 'sell' ou 'search' (attente)
            date: new Date(v.date_out || v.date || Date.now()),
            title: nom,
            val: (v.soldPrice || v.purchase || 0).toLocaleString() + " €",
            immat: immat,
            kms: kms,
            status: v.status || "EN ATTENTE",
            purchase: v.purchase || 0,
            icon: statusBrut === "VENDU" ? '💰' : (type === 'buy' ? '📦' : '⏳'),
            color: statusBrut === "VENDU" ? '#22c55e' : (type === 'buy' ? '#3b82f6' : '#f97316')
        });
    });

    // 2. AJOUT DES RECHERCHES IA (Si elles existent encore à part)
    searches.forEach(s => {
        events.push({
            type: 'search',
            date: new Date(s.timestamp || Date.now()),
            title: "RECHERCHE IA : " + (s.brand || "") + " " + (s.model || ""),
            val: (s.price || 0).toLocaleString() + " €",
            immat: "ESTIMATION",
            kms: "N/A",
            status: "IA",
            icon: '🔍',
            color: '#8b5cf6'
        });
    });

    // Tri par date (plus récent en haut)
    events.sort((a, b) => b.date - a.date);

    // 3. FONCTION DE RENDU D'UNE CARTE
    const renderCard = (e) => `
        <div class="history-card" onclick="this.classList.toggle('open')" style="background:#111; border:1px solid #222; margin-bottom:10px; border-radius:8px; cursor:pointer; overflow:hidden; transition:0.2s;">
            <div style="padding:12px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:1.2rem;">${e.icon}</div>
                    <div>
                        <div style="color:white; font-weight:bold; font-size:0.85rem;">${e.title}</div>
                        <div style="color:#444; font-size:0.7rem;">${e.immat}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="color:${e.color}; font-weight:bold; font-size:0.85rem;">${e.val}</div>
                    <div style="color:#333; font-size:0.6rem;">${e.date.toLocaleDateString()}</div>
                </div>
            </div>
            <div class="details-pane" style="max-height:0; overflow:hidden; transition:0.3s; background:#0a0a0a;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:15px; border-top:1px solid #222; font-size:0.75rem;">
                    <div><span style="color:#444">KILOMÉTRAGE:</span> <span style="color:#eee">${e.kms}</span></div>
                    <div><span style="color:#444">STATUT ACTUEL:</span> <span style="color:${e.color}">${e.status}</span></div>
                    <div><span style="color:#444">PRIX ACHAT:</span> <span style="color:#eee">${e.purchase} €</span></div>
                    <div style="text-align:right;">
                        <button onclick="event.stopPropagation(); window.editDeal('${e.id}')" style="background:#222; color:white; border:1px solid #444; padding:4px 8px; border-radius:4px; font-size:0.6rem; cursor:pointer;">✏️ MODIFIER</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 4. LOGIQUE D'AFFICHAGE (BI-COLONNE VS FILTRE UNIQUE)
    if (filterType === 'all') {
        feed.style.display = "grid";
        feed.style.gridTemplateColumns = "1fr 1fr";
        feed.style.gap = "20px";

        const colFlux = events.filter(e => e.type === 'sell' || e.type === 'buy');
        const colAttente = events.filter(e => e.type === 'search');

        feed.innerHTML = `
            <div class="hist-column">
                <h4 style="color:#666; font-size:0.65rem; margin-bottom:15px; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:5px;">📊 Flux & Livre de Police</h4>
                ${colFlux.map(renderCard).join('') || '<p style="color:#333; font-size:0.7rem;">Aucune transaction.</p>'}
            </div>
            <div class="hist-column">
                <h4 style="color:#666; font-size:0.65rem; margin-bottom:15px; text-transform:uppercase; border-bottom:1px solid #222; padding-bottom:5px;">⏳ Dossiers en Attente</h4>
                ${colAttente.map(renderCard).join('') || '<p style="color:#333; font-size:0.7rem;">Aucun dossier en attente.</p>'}
            </div>
        `;
    } else {
        feed.style.display = "block";
        const filtered = events.filter(e => e.type === filterType);
        feed.innerHTML = filtered.map(renderCard).join('') || `<p style="padding:40px; text-align:center; color:#555;">Aucun résultat pour "${filterType}".</p>`;
    }
};

// --- FONCTIONS DE GESTION DES BOUTONS ---

window.filterHistory = function(type, btn) {
    // Gestion visuelle des boutons
    const buttons = btn.parentElement.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Lancement du filtre
    window.updateHistory(type);
};

window.clearFullHistory = function() {
    if (confirm("⚠️ Voulez-vous vraiment effacer l'historique des recherches IA ?\n(Cela ne supprimera pas vos stocks)")) {
        localStorage.removeItem('ox_searches');
        window.updateHistory();
    }
};

window.editDeal = function(id) {
    if (!id || id === 'undefined') return alert("Impossible de modifier ce dossier (ID manquant).");
    
    const nouveauKm = prompt("Entrez le kilométrage réel du véhicule :");
    if (nouveauKm !== null) {
        let history = JSON.parse(localStorage.getItem('ox_history')) || [];
        const index = history.findIndex(v => v.id === id);
        
        if (index !== -1) {
            history[index].km = nouveauKm;
            localStorage.setItem('ox_history', JSON.stringify(history));
            window.updateHistory();
        } else {
            alert("Erreur : Dossier introuvable.");
        }
    }
};

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour laisser le temps aux données de charger
    setTimeout(() => window.updateHistory('all'), 100);
});

// Ajout du CSS nécessaire
const styleHeader = document.createElement('style');
styleHeader.innerHTML = `
    .history-card.open { border-color: #f97316 !important; background: #151515 !important; }
    .history-card.open .details-pane { max-height: 200px !important; }
    .tab-btn.active { background: #f97316 !important; color: white !important; border-color: #f97316 !important; }
    @media (max-width: 768px) { #history-feed { grid-template-columns: 1fr !important; } }
`;
document.head.appendChild(styleHeader);

// ==========================================================================
// OPTION
// ==========================================================================

// --- RÉCUPÉRATION DES PARAMÈTRES POUR LE SYSTÈME ---
window.getBizSettings = function() {
    const saved = JSON.parse(localStorage.getItem('ox_business_settings'));
    return {
        targetProfit: parseFloat(saved?.targetProfit || 2000),
        defaultPrep: parseFloat(saved?.defaultPrep || 500),
        defaultAdmin: parseFloat(saved?.defaultAdmin || 290),
        tvaRegime: saved?.tvaRegime || "margin",
        stateTax: parseFloat(saved?.stateTax || 11)
    };
};

// --- SAUVEGARDE GLOBALE (Version Corrigée) ---
window.saveAllOptions = function() {
    console.log("Démarrage de la sauvegarde...");

    // 1. Sauvegarde de la grille de prix (Sécurisée)
    try {
        if (typeof saveCustomPrices === "function") {
            saveCustomPrices();
        } else {
            console.warn("La fonction saveCustomPrices n'est pas définie, passage à la suite.");
        }
    } catch (e) {
        console.error("Erreur dans saveCustomPrices:", e);
    }

    // 2. Sauvegarde des nouveaux paramètres business (Sécurisée avec des '?' pour éviter les crashs)
    try {
        const bizSettings = {
            targetProfit: document.getElementById('target-profit')?.value || "2000",
            defaultPrep: document.getElementById('default-prep')?.value || "500",
            defaultAdmin: document.getElementById('default-admin')?.value || "290",
            tvaRegime: document.getElementById('tva-regime')?.value || "margin",
            stateTax: document.getElementById('state-tax')?.value || "11"
        };

        localStorage.setItem('ox_business_settings', JSON.stringify(bizSettings));
        
        // On sauvegarde aussi l'objectif de marge séparément si ton app l'utilise ailleurs
        localStorage.setItem('targetProfit', bizSettings.targetProfit);

        alert("🚀 Tous les réglages ont été synchronisés !");
        
        // Relancer les calculs si la fonction existe
        if (typeof window.runCalculations === 'function') {
            window.runCalculations();
        }
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des réglages business:", e);
        alert("Erreur lors de la sauvegarde. Vérifie la console.");
    }
};
// À la fin de ton window.saveAllOptions existant, ajoute l'appel :
window.calculateGlobalFinances();

// --- EXPORT DES DONNÉES (Backup) ---
window.exportDatabase = function() {
    const data = {
        inventory: window.savedDeals || [],
        searches: JSON.parse(localStorage.getItem('ox_searches')) || [],
        settings: JSON.parse(localStorage.getItem('ox_business_settings')) || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_auto_saas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); // Nécessaire pour certains navigateurs
    a.click();
    document.body.removeChild(a);
};

// --- RESET COMPLET ---
window.resetApp = function() {
    if(confirm("ATTENTION : Cela va effacer TOUT votre stock et vos réglages définitivement. Continuer ?")) {
        localStorage.clear();
        location.reload();
    }
};

// --- CHARGEMENT AU DÉMARRAGE ---
window.loadOptions = function() {
    try {
        const saved = JSON.parse(localStorage.getItem('ox_business_settings'));
        if(saved) {
            if(document.getElementById('target-profit')) document.getElementById('target-profit').value = saved.targetProfit;
            if(document.getElementById('default-prep')) document.getElementById('default-prep').value = saved.defaultPrep;
            if(document.getElementById('default-admin')) document.getElementById('default-admin').value = saved.defaultAdmin;
            if(document.getElementById('tva-regime')) document.getElementById('tva-regime').value = saved.tvaRegime;
            if(document.getElementById('state-tax')) document.getElementById('state-tax').value = saved.stateTax;
        }
    } catch (e) {
        console.error("Erreur lors du chargement des options:", e);
    }
};

// --- CALCULS ET AFFICHAGE FINANCIER SYNCHRONISÉS ---
window.updateFinancials = function() {
    const biz = window.getBizSettings(); // On récupère tes réglages IA
    const history = JSON.parse(localStorage.getItem('ox_history')) || [];
    
    // On ne calcule que sur les véhicules vendus
    const soldVehicles = history.filter(v => v.status === "VENDU");

    let totalVentes = 0;
    let totalAchats = 0;

    soldVehicles.forEach(v => {
        totalVentes += parseFloat(v.soldPrice) || 0;
        totalAchats += parseFloat(v.purchase) || 0;
    });

    const margeBrute = totalVentes - totalAchats;

    // Calcul de la TVA selon ton option choisie
    let tvaDUE = (biz.tvaRegime === "margin") ? (margeBrute * 0.20) : (totalVentes * (biz.stateTax / 100));

    // --- MISE À JOUR DES ÉCRANS (Tes captures 1 et 2) ---
    
    // Écran Trésorerie
    if(document.getElementById('display-ca')) document.getElementById('display-ca').innerText = totalVentes.toLocaleString() + " €";
    if(document.getElementById('display-marge-brute')) document.getElementById('display-marge-brute').innerText = margeBrute.toLocaleString() + " €";
    
    // Écran Admin & Légal (Le petit + vert de ta photo)
    if(document.getElementById('display-tva-due')) document.getElementById('display-tva-due').innerText = tvaDUE.toLocaleString() + " €";
    
    const beneficeNet = margeBrute - tvaDUE;
    if(document.getElementById('display-benefice-net')) {
        document.getElementById('display-benefice-net').innerText = "+ " + beneficeNet.toLocaleString() + " €";
    }
};

// Appeler le chargement au lancement
document.addEventListener('DOMContentLoaded', window.loadOptions);


// À mettre dans tes scripts
window.goToHome = function() {
    showSection('stats'); // Affiche la section
    // Optionnel : simule un clic sur le premier bouton du menu pour mettre l'onglet en surbrillance
    const firstBtn = document.querySelector('nav button');
    if(firstBtn) firstBtn.click(); 
};

document.addEventListener('DOMContentLoaded', () => {
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    const menuIcon = menuBtn ? menuBtn.querySelector('i') : null;

    function toggleMenu() {
        if (!sidebar) return;
        const isOpen = sidebar.classList.toggle('active');
        
        // Mise à jour de l'icône
        if (menuIcon) {
            menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
            if (window.lucide) lucide.createIcons();
        }

        // Bloque le scroll du site en arrière-plan
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (menuBtn) {
        // e.preventDefault() est crucial ici pour éviter les doubles clics sur mobile
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }

    // On ferme si on clique sur un lien ou le logo intérieur
    const closeItems = document.querySelectorAll('.nav-item, .sidebar .logo');
    closeItems.forEach(item => {
        item.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) toggleMenu();
        });
    });

    // Fermer en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                toggleMenu();
            }
        }
    });
});

// ==========================================================================
// 9. INITIALISATION
// ==========================================================================
window.initApp = function() {
    window.renderExpertise();
    window.updatePilotage();
    // On s'assure que si on est sur l'onglet négo, les calculs sont faits
    window.runCalculations(); 
    window.switchTab('pilotage');
};

window.onload = window.initApp;

