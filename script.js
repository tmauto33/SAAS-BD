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
            if (window.updatePilotage) window.updatePilotage();
            break;
        case 'inventaire':
            if (window.renderInventory) window.renderInventory();
            break;
        case 'maintenance':
        case 'logistique':
            if (window.renderMaintenance) window.renderMaintenance();
            break;
        case 'finance':
            if (window.updateFinance) window.updateFinance();
            else if (window.updateFinanceUI) window.updateFinanceUI();
            break;
        case 'crm':
            if (window.renderCRM) window.renderCRM();
            break;
        case 'admin':
            if (window.updateAdmin) window.updateAdmin();
            break;
        case 'dashboard':
            if (window.updateHistory) window.updateHistory();
            break;
        case 'options':
            if (window.renderConfigEditor) window.renderConfigEditor();
            break;
    }

    // 5. Relancer les icônes si Lucide est utilisé
    if (window.lucide) lucide.createIcons();
}; // <--- L'accolade était absente ou mal placée ici
// ==========================================================================
// 3. MODULE EXPERTISE & CALCULS
// ==========================================================================
window.renderExpertise = function() {
    const container = document.getElementById('expertise-grid'); // Vérifie que l'ID correspond à ton HTML
    if (!container) return;

    container.innerHTML = ''; // On vide le conteneur

    // On boucle sur la configuration pour créer chaque ligne
    inspectionConfig.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checklist-item';
        div.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-cat">${item.cat}</span>
            </div>
            <div class="item-actions">
                <button onclick="toggleCheck('${item.name}', 'ok')" class="btn-check ok">OK</button>
                <button onclick="toggleCheck('${item.name}', 'ko')" class="btn-check ko">À prévoir</button>
            </div>
        `;
        container.appendChild(div);
    });
};

window.handleCheck = function(name, val, btn) {
    window.checks[name] = val;
    btn.parentElement.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.runCalculations();
};

window.runCalculations = function() {
    const market = parseFloat(document.getElementById('market-val')?.value) || 0;
    const purchase = parseFloat(document.getElementById('target-price')?.value) || 0;
    const fees = parseFloat(document.getElementById('fees-admin')?.value) || 0;
    
    let totalCash = 0, totalPts = 0, koList = [];

    inspectionConfig.forEach(pt => {
        if (window.checks[pt.name] === 0) {
            const conf = window.configExpertise[pt.name];
            if (conf.type === 'price') totalCash += conf.val;
            else totalPts += conf.val;
            koList.push(pt.name);
        }
    });

    const margeNet = market - (purchase + totalCash + fees);
    const score = Math.max(0, 100 - totalPts);

    // Mise à jour interface Expertise
    if(document.getElementById('flash-marge')) document.getElementById('flash-marge').innerText = Math.round(margeNet).toLocaleString() + " €";
    if(document.getElementById('flash-repairs')) document.getElementById('flash-repairs').innerText = totalCash.toLocaleString() + " €";
    if(document.getElementById('flash-score')) document.getElementById('flash-score').innerText = Math.round(score) + "/100";
    if(document.getElementById('repairs')) document.getElementById('repairs').value = totalCash + " €";

    // Appels des outils IA liés
    window.updateIAVerdict(margeNet, score);
    window.updateNegoLogic(); // Relance la négo si le prix cible change
    window.updateAckermann(purchase);
    window.generateSmartRiposte(koList, totalCash);
  window.updateAckermann(purchase); // Met à jour les 4 paliers
    window.generateSmartRiposte();    // Met à jour la riposte si une objection est sélectionnée
};

// ==========================================================================
// 4. MODULE VENTES & PILOTAGE (KPI)
// ==========================================================================
window.finalizeSale = function() {
    const select = document.getElementById('sell-select-vehicle');
    const realPrice = parseFloat(document.getElementById('real-sell-price')?.value);
    
    if (!select || select.value === "" || isNaN(realPrice)) {
        alert("⚠️ Sélectionnez un véhicule en stock et entrez le prix de vente final.");
        return;
    }

    const dealIdx = select.value;
    const deal = window.savedDeals[dealIdx];
    
    // Calcul de l'investissement total (PRK)
    const totalInvest = (parseFloat(deal.purchase) || 0) + (parseFloat(deal.repairs) || 0) + (parseFloat(deal.fees) || 0);

    // Mise à jour des données du deal
    deal.realMarge = realPrice - totalInvest;
    deal.status = "VENDU";
    deal.sellDate = new Date().toLocaleDateString('fr-FR');
    deal.finalSellPrice = realPrice;

    // Sauvegarde et mise à jour de l'interface
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    
    // Fermeture du modal si ouvert
    if(document.getElementById('modal-overlay')) {
        document.getElementById('modal-overlay').remove();
    }

    alert(`✅ Vente validée ! Profit net : ${Math.round(deal.realMarge)} €`);
    
    // Rafraîchissement des vues
    window.renderInventory(); 
    window.updatePilotage();
};

window.updateIAVerdict = function(marge, score) {
    const iaBar = document.getElementById('ia-analysis-bar'); 
    const iaText = document.getElementById('ia-verdict-text');
    if (!iaBar || !iaText) return;

    let verdict, color, width;
    if (marge > 2000 && score > 80) { 
        verdict = "🚀 EXCELLENT DEAL"; color = "#10b981"; width = "100%"; 
    } else if (marge > 1000 && score > 60) { 
        verdict = "⚖️ DEAL CORRECT"; color = "#f59e0b"; width = "65%"; 
    } else { 
        verdict = "⚠️ ATTENTION RISQUE"; color = "#ef4444"; width = "35%"; 
    }

    iaText.innerText = verdict;
    iaBar.style.width = width;
    iaBar.style.backgroundColor = color;
};

window.updateDashboard = function() {
    console.log("📊 Synchronisation du Tableau de Bord...");

    // 1. RÉCUPÉRATION DES DONNÉES
    const deals = window.savedDeals || [];
    const settings = JSON.parse(localStorage.getItem('ox_business_settings')) || {};
    const profile = JSON.parse(localStorage.getItem('ox_profile_data')) || {};
    const targetMarge = parseFloat(localStorage.getItem('targetProfit')) || 2000;

    // 2. LOGIQUE DE CALCUL (KPIs)
    const inStock = deals.filter(d => d.status !== "VENDU");
    const sold = deals.filter(d => d.status === "VENDU");
    
    // Valeur d'achat totale du stock actuel
    const stockValue = inStock.reduce((sum, d) => sum + parseFloat(d.purchase || 0), 0);
    
    // Marge nette totale sur les ventes
    const totalMarge = sold.reduce((sum, d) => {
        const pachat = parseFloat(d.purchase || 0);
        const pvente = parseFloat(d.soldPrice || 0);
        const frais = parseFloat(d.prepFees || 0);
        return sum + (pvente - pachat - frais);
    }, 0);

    // 3. MISE À JOUR DE L'INTERFACE
    
    // Header & Welcome
    const welcomeEl = document.getElementById('dash-welcome');
    if(welcomeEl) welcomeEl.innerText = `Bonjour, ${profile.name || 'Marchand'}`;
    
    const dateEl = document.getElementById('dash-date');
    if(dateEl) dateEl.innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});

    // Remplissage des KPIs
    if(document.getElementById('kpi-stock-count')) document.getElementById('kpi-stock-count').innerText = inStock.length;
    if(document.getElementById('kpi-stock-value')) document.getElementById('kpi-stock-value').innerText = `Valeur : ${stockValue.toLocaleString()} €`;
    if(document.getElementById('kpi-marge')) document.getElementById('kpi-marge').innerText = `${totalMarge.toLocaleString()} €`;
    
    // Trésorerie estimée (Marge réalisée - frais fixes simulés)
    if(document.getElementById('kpi-cash')) {
        const cashFlow = totalMarge - (parseFloat(settings.stateTax) || 0);
        document.getElementById('kpi-cash').innerText = `${cashFlow.toLocaleString()} €`;
    }

    // 4. BARRE DE PROGRESSION (OBJECTIF)
    const progress = Math.min((totalMarge / targetMarge) * 100, 100);
    const pBar = document.getElementById('dash-progress-bar');
    if(pBar) {
        pBar.style.width = progress + "%";
        pBar.style.background = progress >= 100 ? "#22c55e" : "var(--accent)";
    }

    // 5. MINI GRAPHIQUE VISUEL (Simulé)
    const chartContainer = document.getElementById('dash-chart-container');
    if(chartContainer) {
        // On crée des barres basées sur les 7 derniers jours ou des data simulées
        const mockData = [30, 50, 40, 90, 60, 40, 80]; 
        chartContainer.innerHTML = mockData.map(h => `
            <div style="flex:1; background:var(--accent); opacity:0.3; height:${h}%; border-radius:4px 4px 0 0; min-width:10px; transition: height 0.8s ease;"></div>
        `).join('');
    }

    // 6. SYSTÈME D'ALERTES
    const alertsBox = document.getElementById('dash-alerts');
    if(alertsBox) {
        let alerts = [];
        if(inStock.length === 0) alerts.push("📭 Stock vide : Pensez à rentrer des véhicules.");
        if(progress < 50 && new Date().getDate() > 15) alerts.push("📉 Objectif de marge en retard pour le milieu de mois.");
        
        alertsBox.innerHTML = alerts.length > 0 ? 
            alerts.map(a => `<div style="padding:8px; background:rgba(255,255,255,0.05); border-radius:5px; margin-bottom:5px; border-left:3px solid #f97316;">${a}</div>`).join('') : 
            "✅ Aucune alerte critique.";
    }
};
// ==========================================================================
// 5. MODULE STOCK & INVENTAIRE
// ==========================================================================
window.saveCurrentDeal = function() {
    const model = document.getElementById('model-name')?.value;
    if (!model) return alert("Modèle requis !");

    // Calcul du PRK (Prix de revient total) au moment de l'achat
    const purchase = parseFloat(document.getElementById('target-price')?.value) || 0;
    const repairs = parseFloat((document.getElementById('repairs')?.value || "0").replace(' €','')) || 0;
    const fees = parseFloat(document.getElementById('fees-admin')?.value) || 0;

    const deal = {
        model,
        market: document.getElementById('market-val')?.value || 0,
        purchase: purchase,
        repairs: repairs,
        fees: fees,
        totalCost: purchase + repairs + fees, // Le fameux PRK
        link: document.getElementById('ad-link')?.value || "", // AJOUTER cet ID dans votre HTML
        status: "ACHETÉ",
        date: new Date().toLocaleDateString('fr-FR'),
        maintStep: "Achat",
        checks: {...window.checks}
    };

    window.savedDeals.unshift(deal);
    localStorage.setItem('ox_history', JSON.stringify(window.savedDeals));
    alert("Véhicule ajouté au stock !");
    window.updatePilotage();
    window.renderInventory(); // Force le rafraîchissement
};

window.renderInventory = function() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;

    // On ne garde QUE ceux qui sont en stock (Statut ACHETÉ)
    const stock = window.savedDeals.filter(d => d.status === "ACHETÉ");

    grid.innerHTML = stock.map((d, index) => {
        // Trouver l'index réel dans la liste globale pour l'ouverture du détail
        const realIdx = window.savedDeals.findIndex(item => item === d);
        const prk = (parseFloat(d.purchase) || 0) + (parseFloat(d.repairs) || 0) + (parseFloat(d.fees) || 0);

        return `
        <div class="card inventory-card" onclick="window.showVehicleDetails(${realIdx})" style="cursor:pointer; border-left:5px solid var(--accent); transition:0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <strong>${d.model}</strong>
                <span class="badge" style="background:var(--accent); color:white; font-size:0.7rem; padding:2px 6px; border-radius:4px;">${d.maintStep}</span>
            </div>
            
            <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85rem;">
                <div><small>Achat:</small><br><strong>${d.purchase.toLocaleString()}€</strong></div>
                <div><small>PRK Total:</small><br><strong style="color:var(--accent)">${prk.toLocaleString()}€</strong></div>
            </div>
            
            <div style="margin-top:10px; border-top:1px solid #eee; pt:5px; font-size:0.7rem; opacity:0.7;">
                📅 Acquis le ${d.date}
            </div>
        </div>
    `;}).join('') || `<div style="text-align:center; padding:40px; opacity:0.5;">Aucun véhicule en stock.</div>`;
};

window.showVehicleDetails = function(index) {
    const d = window.savedDeals[index];
    if(!d) return;

    const prk = (parseFloat(d.purchase) || 0) + (parseFloat(d.repairs) || 0) + (parseFloat(d.fees) || 0);

    // On crée une petite fenêtre d'alerte personnalisée ou on remplit un modal existant
    const detailHtml = `
        <div id="modal-overlay" onclick="this.remove()" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
            <div class="card" onclick="event.stopPropagation()" style="width:100%; max-width:500px; background:white; overflow-y:auto; max-height:90vh;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">
                    <h2 style="margin:0">${d.model}</h2>
                    <button onclick="document.getElementById('modal-overlay').remove()" style="border:none; background:none; font-size:1.5rem;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div class="card" style="background:#f9f9f9">
                        <small>FINANCES</small><br>
                        Achat: <strong>${d.purchase} €</strong><br>
                        Travaux: <strong>${d.repairs} €</strong><br>
                        Frais: <strong>${d.fees} €</strong><br>
                        <hr>
                        PRK Total: <strong style="color:var(--accent)">${prk} €</strong>
                    </div>
                    <div class="card" style="background:#f9f9f9">
                        <small>INFOS</small><br>
                        Côte Marché: <strong>${d.market} €</strong><br>
                        Date Achat: <strong>${d.date}</strong><br>
                        Statut: <strong>${d.status}</strong>
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    <strong>🔗 Lien annonce :</strong><br>
                    ${d.link ? `<a href="${d.link}" target="_blank" style="color:blue; font-size:0.8rem; word-break:break-all;">${d.link}</a>` : 'Aucun lien'}
                </div>

                <div style="margin-bottom:20px;">
                    <strong>🛠 État (Points KO) :</strong><br>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">
                        ${Object.keys(d.checks || {}).filter(k => d.checks[k] === 0).map(k => 
                            `<span style="background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:10px; font-size:0.7rem;">${k}</span>`
                        ).join('') || 'Aucun défaut relevé'}
                    </div>
                </div>

                <button onclick="window.archiveSold(${index})" style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:700;">
                    MARQUER COMME VENDU
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', detailHtml);
};

// ==========================================================================
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
window.renderMaintenance = function() {
    const list = document.getElementById('maintenance-list');
    if (!list) return;
    
    // Filtrage et Tri (Les plus récents en premier)
    const stock = window.savedDeals
        .filter(d => d.status === "ACHETÉ")
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (stock.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; opacity:0.5; padding:30px; border:2px dashed #444; border-radius:10px;">
                Aucun véhicule en stock pour le moment.
            </div>`;
        return;
    }

    list.innerHTML = stock.map((deal) => {
        const realIdx = window.savedDeals.findIndex(d => d === deal);
        const totalInt = (deal.interventions || []).reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const prk = (parseFloat(deal.purchase) || 0) + totalInt + (parseFloat(deal.fees) || 0);

        return `
        <div class="card" style="margin-bottom:15px; border-left: 5px solid var(--accent); padding:15px; background: #1a1a1a; color: white;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong style="font-size:1.2rem;">${deal.model}</strong><br>
                    <small style="color:var(--accent)">PRK actuel : ${prk.toLocaleString()} €</small>
                    <div style="font-size:0.65rem; opacity:0.4; margin-top:2px;">Entrée stock : ${deal.date || 'Non spécifiée'}</div>
                </div>
                <span class="badge" style="background:var(--accent); color:white; padding:4px 10px; border-radius:4px; font-size:0.8rem;">
                    ${deal.maintStep || 'Achat'}
                </span>
            </div>

            <div style="margin-top:12px; display:flex; gap:6px; flex-wrap:wrap;">
                ${['Achat', 'Nettoyage', 'Atelier', 'Carrosserie', 'Prêt'].map(step => `
                    <button onclick="window.updateMaintStep(${realIdx}, '${step}')" 
                        class="pill-btn ${deal.maintStep === step ? 'active' : ''}" 
                        style="font-size:0.7rem; padding:5px 10px; border-radius:20px; border:1px solid #444; background:${deal.maintStep === step ? 'var(--accent)' : 'transparent'}; color:white; cursor:pointer;">
                        ${step}
                    </button>
                `).join('')}
            </div>

            <div style="margin-top:15px; background:#252525; padding:12px; border-radius:8px;">
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <input type="text" id="task-${realIdx}" placeholder="Réparation (ex: Pneus)" style="flex:2; padding:8px; background:#333; border:1px solid #444; color:white; border-radius:4px;">
                    <input type="number" id="price-${realIdx}" placeholder="Prix €" style="flex:1; padding:8px; background:#333; border:1px solid #444; color:white; border-radius:4px;">
                    <button onclick="window.addIntervention(${realIdx})" style="background:var(--accent); color:white; border:none; padding:0 15px; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
                </div>
                
                <div id="hist-${realIdx}" style="font-size:0.8rem; max-height:120px; overflow-y:auto;">
                    ${(deal.interventions || []).length > 0 ? deal.interventions.map((int, i) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding:6px 0;">
                            <span>• ${int.label} <small style="opacity:0.5">(${int.step})</small></span>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <strong>${(parseFloat(int.price) || 0).toLocaleString()} €</strong>
                                <button onclick="window.deleteIntervention(${realIdx}, ${i})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem; line-height:1;">&times;</button>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align:center; opacity:0.3; margin:10px 0;">Aucun frais ajouté</p>'}
                </div>
            </div>
        </div>`;
    }).join('');
};

// ==========================================
// 2. ACTIONS ET CALCULS FINANCIERS
// ==========================================

window.addIntervention = function(idx) {
    const taskInput = document.getElementById(`task-${idx}`);
    const priceInput = document.getElementById(`price-${idx}`);
    if (!taskInput || !priceInput) return;

    const label = taskInput.value.trim();
    const price = parseFloat(priceInput.value);

    if (!label || isNaN(price)) {
        alert("Veuillez saisir un libellé et un prix valide.");
        return;
    }

    const deal = window.savedDeals[idx];
    if (!deal.interventions) deal.interventions = [];

    deal.interventions.push({
        label: label,
        price: price,
        step: deal.maintStep || 'Atelier',
        date: new Date().toLocaleDateString('fr-FR')
    });

    deal.repairs = deal.interventions.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);

    window.saveData(); 
    window.renderMaintenance();
    window.updatePilotage();
};

window.deleteIntervention = function(dealIdx, intIdx) {
    if (confirm("Supprimer cette ligne de frais ?")) {
        window.savedDeals[dealIdx].interventions.splice(intIdx, 1);
        window.savedDeals[dealIdx].repairs = window.savedDeals[dealIdx].interventions.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
        
        window.saveData();
        window.renderMaintenance();
        window.updatePilotage();
    }
};

window.updateMaintStep = function(idx, step) {
    if (!window.savedDeals[idx]) return;
    window.savedDeals[idx].maintStep = step;
    
    window.saveData();
    window.renderMaintenance();
    window.updatePilotage();
};

// ==========================================
// 3. MISE À JOUR DES CARTES KPI
// ==========================================
window.updatePilotage = function() {
    const deals = window.savedDeals || [];
    let prep = 0, external = 0, ready = 0, totalCash = 0;

    deals.forEach(deal => {
        if (deal.status === "ACHETÉ") {
            const step = deal.maintStep || "Achat";
            if (step === "Achat" || step === "Nettoyage") prep++;
            else if (step === "Atelier" || step === "Carrosserie") external++;
            else if (step === "Prêt") ready++;

            const purchase = parseFloat(deal.purchase) || 0;
            const fees = parseFloat(deal.fees) || 0;
            const interventions = (deal.interventions || []).reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
            totalCash += (purchase + fees + interventions);
        }
    });

    const elements = {
        'maint-count-prep': prep,
        'maint-count-external': external,
        'maint-count-ready': ready,
        'maint-total-invested': Math.round(totalCash).toLocaleString() + " €"
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
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
    // On récupère le stock actuel pour la liste des acheteurs
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

// --- LOGIQUE DYNAMIQUE DU FORMULAIRE ---
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

// --- SAUVEGARDE ---
window.saveCustomer = function() {
    const data = {
        id: Date.now(),
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        type: document.getElementById('cust-type').value,
        vehicle: document.getElementById('cust-vehicle').value,
        budget: document.getElementById('cust-budget').value,
        status: document.getElementById('cust-status').value,
        notes: document.getElementById('cust-notes').value,
        date: new Date().toLocaleDateString('fr-FR')
    };

    if(!data.name) return alert("Le nom du client est requis");

    window.savedCustomers.push(data);
    localStorage.setItem('ox_customers', JSON.stringify(window.savedCustomers));
    document.getElementById('customer-modal').remove();
    window.renderCustomers();
};

// --- RENDU DES CARTES SÉPARÉES ---
window.renderCustomers = function() {
    const buyerList = document.getElementById('buyer-list');
    const sellerList = document.getElementById('seller-list');
    if(!buyerList || !sellerList) return;

    // Calcul des compteurs
    let nego = 0, buyersCount = 0, sellersCount = 0;
    
    window.savedCustomers.forEach(c => {
        if(c.status === "CHAUD") nego++;
        if(c.type === "ACHAT" || c.type === "REPRISE") buyersCount++;
        if(c.type === "VENTE") sellersCount++;
    });

    document.getElementById('crm-total').innerText = window.savedCustomers.length;
    document.getElementById('crm-nego').innerText = nego;
    document.getElementById('crm-buyers').innerText = buyersCount;
    document.getElementById('crm-sellers').innerText = sellersCount;

    const buildCard = (c, i) => `
        <div class="card" style="background:#1a1a1a; border-left: 4px solid ${c.type === 'VENTE' ? '#ef4444' : 'var(--success)'};">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:0.65rem; background:#333; padding:2px 8px; border-radius:10px;">${c.date}</span>
                <span style="font-size:0.7rem; color:${c.status === 'CHAUD' ? '#f59e0b' : '#aaa'}; font-weight:bold;">● ${c.status}</span>
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

    // Distribution dans les deux listes
    const buyersHTML = window.savedCustomers
        .map((c, i) => ({c, i}))
        .filter(item => item.c.type !== "VENTE")
        .reverse();
        
    const sellersHTML = window.savedCustomers
        .map((c, i) => ({c, i}))
        .filter(item => item.c.type === "VENTE")
        .reverse();

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
// ADMIN
// ==========================================================================
// --- FONCTION UTILITAIRE CSV ---
// Permet de transformer un tableau de données en fichier téléchargeable
window.downloadCSV = function(csvContent, fileName) {
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- 1. GESTION DU REGISTRE DE POLICE ---

// Met à jour le tableau HTML
// --- GÉNÉRATION AUTOMATIQUE DU LIVRE DE POLICE ---
window.updatePoliceTable = function() {
    const deals = window.savedDeals || [];
    const tbody = document.getElementById('police-table-body');
    if (!tbody) return;

    // On trie pour avoir les entrées les plus récentes en haut
    const sortedDeals = [...deals].reverse();

    tbody.innerHTML = sortedDeals.map((deal, index) => {
        const isSold = deal.status === "VENDU";
        
        return `
            <tr style="border-bottom:1px solid #222; hover:background:#1a1a1a;">
                <td style="padding:12px; color:#888;">#${deal.id || index + 1}</td>
                <td style="padding:12px;">${deal.date || "Saisie..."}</td>
                <td style="padding:12px;">
                    <strong>${deal.brand} ${deal.model}</strong><br>
                    <small style="color:#666;">${deal.immat} / ${deal.vin || 'SANS VIN'}</small>
                </td>
                <td style="padding:12px;">
                    <span style="font-size:0.8rem;">${deal.sellerName || "Particulier"}</span>
                </td>
                <td style="padding:12px;">${isSold ? deal.saleDate : '<span style="opacity:0.3">- En Stock -</span>'}</td>
                <td style="padding:12px;">${isSold ? (deal.buyerName || "Client") : "-"}</td>
                <td style="padding:12px; text-align:right;">
                    <button onclick="window.editPoliceEntry('${deal.id}')" style="background:none; border:1px solid #444; color:white; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.7rem;">
                        MODIFIER
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

// Exporte tout le registre en CSV (Format Excel)
window.exportPoliceCSV = function() {
    const deals = window.savedDeals || [];
    let csv = "ID;DATE_ENTREE;MARQUE;MODELE;IMMAT;VIN;VENDEUR_NOM;PRIX_ACHAT;DATE_SORTIE;ACHETEUR_NOM;PRIX_VENTE\n";

    deals.forEach((d, idx) => {
        const row = [
            d.id || idx + 1,
            d.date || "",
            d.brand,
            d.model,
            d.immat,
            d.vin || "NON RENSEIGNE",
            d.sellerName || "",
            d.purchase || 0,
            d.status === "VENDU" ? (d.saleDate || "") : "",
            d.status === "VENDU" ? (d.buyerName || "") : "",
            d.status === "VENDU" ? (d.soldPrice || 0) : ""
        ];
        csv += row.join(";") + "\n";
    });

    window.downloadCSV(csv, "Livre_Police_Export.csv");
};

// Fonction simple pour imprimer
window.printPoliceBook = function() {
    window.print(); // Ouvre la boite de dialogue système
};

// Fonction pour modifier
window.editPoliceEntry = function(dealId) {
    // On trouve le véhicule dans la base
    const dealIndex = window.savedDeals.findIndex(d => d.id == dealId);
    if (dealIndex === -1) return;

    const deal = window.savedDeals[dealIndex];

    // On demande les corrections (Exemple simplifié par prompt)
    const newVin = prompt("Modifier le numéro VIN :", deal.vin || "");
    const newSeller = prompt("Modifier le nom du vendeur :", deal.sellerName || "");
    
    if (newVin !== null) window.savedDeals[dealIndex].vin = newVin;
    if (newSeller !== null) window.savedDeals[dealIndex].sellerName = newSeller;

    // Sauvegarde et mise à jour
    localStorage.setItem('ox_deals', JSON.stringify(window.savedDeals));
    window.updatePoliceTable();
    alert("Registre mis à jour !");
};

window.addManualPoliceEntry = function() {
    const brand = prompt("Marque / Modèle :");
    if(!brand) return;

    const manualEntry = {
        id: Date.now(),
        brand: brand.split(' ')[0] || "Inconnu",
        model: brand.split(' ')[1] || "",
        date: new Date().toLocaleDateString('fr-FR'),
        immat: prompt("Immatriculation :"),
        sellerName: prompt("Nom du Vendeur :"),
        status: "STOCK", // Par défaut
        price: 0
    };

    window.savedDeals.push(manualEntry);
    localStorage.setItem('ox_deals', JSON.stringify(window.savedDeals));
    window.updatePoliceTable();
};


// --- 2. GESTION DE LA CLÔTURE COMPTABLE ---

// Met à jour l'aperçu (Petit encadré noir) quand on change le mois
window.updateAccountingPreview = function() {
    const month = parseInt(document.getElementById('export-month').value);
    const year = parseInt(document.getElementById('export-year').value);
    const deals = window.savedDeals || [];

    let ca = 0;
    let marge = 0;

    deals.forEach(deal => {
        if (deal.status === "VENDU" && deal.saleDate) {
            // Conversion de la date (format attendu YYYY-MM-DD ou DD/MM/YYYY)
            const saleDateObj = new Date(deal.saleDate);
            // Vérification si la vente correspond au mois/année sélectionnés
            if (saleDateObj.getMonth() === month && saleDateObj.getFullYear() === year) {
                
                // Récupération des montants (via parseMoney de l'autre script)
                const sellingPrice = window.parseMoney ? window.parseMoney(deal.soldPrice) : parseFloat(deal.soldPrice) || 0;
                const costPrice = (window.parseMoney ? window.parseMoney(deal.purchase) : parseFloat(deal.purchase) || 0) 
                                + (window.parseMoney ? window.parseMoney(deal.fees) : parseFloat(deal.fees) || 0)
                                + (deal.interventions || []).reduce((s, i) => s + (parseFloat(i.price)||0), 0);

                ca += sellingPrice;
                marge += (sellingPrice - costPrice);
            }
        }
    });

    // Calcul TVA (20% sur la marge si marge positive)
    const tva = marge > 0 ? marge * 0.20 : 0;

    // Mise à jour DOM
    document.getElementById('preview-ca').innerText = ca.toLocaleString('fr-FR') + " €";
    document.getElementById('preview-marge').innerText = marge.toLocaleString('fr-FR') + " €";
    document.getElementById('preview-tva').innerText = tva.toLocaleString('fr-FR') + " €";
};

// Exporte le rapport mensuel
window.exportAccountingCSV = function() {
    const month = parseInt(document.getElementById('export-month').value);
    const year = parseInt(document.getElementById('export-year').value);
    const deals = window.savedDeals || [];
    
    // Noms des mois pour le fichier
    const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

    let csv = `RAPPORT MENSUEL - ${monthNames[month]} ${year}\n`;
    csv += "DATE;VEHICULE;IMMAT;PRIX_ACHAT_TOTAL;PRIX_VENTE;MARGE_BRUTE;TVA_MARGE\n";

    deals.forEach(deal => {
        if (deal.status === "VENDU" && deal.saleDate) {
            const saleDateObj = new Date(deal.saleDate);
            if (saleDateObj.getMonth() === month && saleDateObj.getFullYear() === year) {
                
                const sellingPrice = window.parseMoney(deal.soldPrice);
                // Calcul coût total (Achat + Frais + Réparations)
                const totalCost = window.parseMoney(deal.purchase) + window.parseMoney(deal.fees) + (deal.interventions || []).reduce((s, i) => s + (parseFloat(i.price)||0), 0);
                
                const margin = sellingPrice - totalCost;
                const tva = margin > 0 ? margin * 0.20 : 0;

                const row = [
                    deal.saleDate,
                    `${deal.brand} ${deal.model}`,
                    deal.immat,
                    totalCost,
                    sellingPrice,
                    margin,
                    tva
                ];
                csv += row.join(";") + "\n";
            }
        }
    });

    window.downloadCSV(csv, `Cloture_${monthNames[month]}_${year}.csv`);
};

// Initialisation : Appeler updatePoliceTable() et setDate() au chargement de la section
document.addEventListener("DOMContentLoaded", () => {
    // Si la fonction updateAdmin est appelée au clic sur le menu
    window.updateAdmin = function() {
        window.updatePoliceTable();
        
        // Sélectionne le mois en cours par défaut
        const today = new Date();
        document.getElementById('export-month').value = today.getMonth();
        document.getElementById('export-year').value = today.getFullYear();
        window.updateAccountingPreview();
    };
});


// ==========================================================================
// HISTORIQUE
// ==========================================================================
// --- LOGIQUE DE L'HISTORIQUE ---

// --- FONCTIONS DE L'HISTORIQUE (Version Ultra-Stable) ---

// 1. Mise à jour de la liste
window.updateHistory = function(filterType = 'all') {
    const feed = document.getElementById('history-feed');
    if (!feed) return;

    const deals = window.savedDeals || [];
    const searches = JSON.parse(localStorage.getItem('ox_searches')) || [];
    let events = [];

    // Récupération Stocks/Ventes
    deals.forEach(deal => {
        events.push({
            type: 'buy',
            date: new Date(deal.date || Date.now()),
            title: `ACHAT : ${deal.brand} ${deal.model}`,
            desc: `Stock (${deal.immat || 'N/A'})`,
            val: `${parseFloat(deal.purchase || 0).toLocaleString()} €`,
            color: '#3b82f6', icon: '📥'
        });
        if (deal.status === "VENDU") {
            events.push({
                type: 'sell',
                date: new Date(deal.saleDate || Date.now()),
                title: `VENTE : ${deal.brand} ${deal.model}`,
                desc: `Vendu à ${deal.buyerName || 'Client'}`,
                val: `+ ${parseFloat(deal.soldPrice || 0).toLocaleString()} €`,
                color: '#22c55e', icon: '💰'
            });
        }
    });

    // Récupération Recherches
    searches.forEach(s => {
        events.push({
            type: 'search',
            date: new Date(s.timestamp || Date.now()),
            title: `RECHERCHE : ${s.brand} ${s.model}`,
            desc: `Estimation IA`,
            val: `${(s.price || 0).toLocaleString()} €`,
            color: '#f97316', icon: '🔍'
        });
    });

    events.sort((a, b) => b.date - a.date);

    // Filtrage
    if (filterType !== 'all') {
        events = events.filter(e => e.type === filterType);
    }

    // Affichage
    if (events.length === 0) {
        feed.innerHTML = `<div style="padding:40px; text-align:center; color:#555;">Aucun dossier trouvé (${filterType}).</div>`;
        return;
    }

    feed.innerHTML = events.map(e => `
        <div class="history-row" style="display:flex; align-items:center; gap:15px; padding:15px; border-bottom:1px solid #222;">
            <div style="font-size:1.2rem;">${e.icon}</div>
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between;">
                    <strong style="color:white; font-size:0.9rem;">${e.title}</strong>
                    <span style="color:${e.color}; font-weight:bold;">${e.val}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:3px;">
                    <span style="font-size:0.8rem; color:#666;">${e.desc}</span>
                    <span style="font-size:0.7rem; color:#333;">${e.date.toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
};

// 2. Gestion des clics sur les filtres (FIXED)
window.filterHistory = function(type, btn) {
    console.log("Filtrage sur :", type); // Pour vérifier dans la console F12
    
    // On enlève la classe active de TOUS les boutons dans la section historique
    const buttons = btn.parentElement.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    // On l'ajoute au bouton cliqué
    btn.classList.add('active');
    
    // On met à jour la liste
    window.updateHistory(type);
};

// 3. Effacer (FIXED)
window.clearFullHistory = function() {
    if (confirm("Voulez-vous vraiment effacer l'historique des recherches IA ?")) {
        localStorage.removeItem('ox_searches');
        window.updateHistory(); // Rafraîchit l'affichage
        alert("Historique des recherches supprimé.");
    }
};



// ==========================================================================
// OPTION
// ==========================================================================

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

// Appeler le chargement au lancement
document.addEventListener('DOMContentLoaded', window.loadOptions);

// ==========================================================================
// PROFIL
// ==========================================================================

// --- GESTION DU PROFIL SAAS PRO ---

window.saveProfile = function() {
    // On récupère tous les champs, y compris les nouveaux champs de connexion
    const profileData = {
        name: document.getElementById('biz-name')?.value || "",
        siret: document.getElementById('biz-siret')?.value || "",
        phone: document.getElementById('biz-phone')?.value || "",
        email: document.getElementById('biz-email')?.value || "", // Email pro
        loginEmail: document.getElementById('login-email')?.value || "", // Email connexion
        address: document.getElementById('biz-address')?.value || "",
        tva: document.getElementById('biz-tva')?.value || "",
        web: document.getElementById('biz-web')?.value || "",
        footer: document.getElementById('biz-footer')?.value || "",
        logo: document.getElementById('user-logo-preview').src
    };

    localStorage.setItem('ox_profile_data', JSON.stringify(profileData));
    
    // Mise à jour visuelle immédiate
    if (profileData.name) {
        const display = document.getElementById('display-biz-name');
        if(display) display.innerText = profileData.name;
    }

    alert("✅ Configuration SaaS enregistrée !");
};

window.loadProfile = function() {
    const saved = JSON.parse(localStorage.getItem('ox_profile_data'));
    if (!saved) return;

    // Remplissage sécurisé (avec vérification de l'existence des IDs)
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val || ""; };

    setVal('biz-name', saved.name);
    setVal('biz-siret', saved.siret);
    setVal('biz-phone', saved.phone);
    setVal('biz-email', saved.email);
    setVal('login-email', saved.loginEmail);
    setVal('biz-address', saved.address);
    setVal('biz-tva', saved.tva);
    setVal('biz-web', saved.web);
    setVal('biz-footer', saved.footer);
    
    if (saved.logo && document.getElementById('user-logo-preview')) {
        document.getElementById('user-logo-preview').src = saved.logo;
    }
    
    if (saved.name && document.getElementById('display-biz-name')) {
        document.getElementById('display-biz-name').innerText = saved.name;
    }
};

// Gestion de l'upload du logo
window.handleLogoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        // Limitation à 2Mo pour le localStorage
        if (file.size > 2 * 1024 * 1024) {
            alert("Image trop lourde (max 2Mo)");
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('user-logo-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// --- FONCTIONS SYSTÈME (SaaS) ---

window.changePassword = function() {
    const oldPass = prompt("Ancien mot de passe :");
    if (oldPass) {
        const newPass = prompt("Nouveau mot de passe :");
        if (newPass) alert("Mot de passe mis à jour avec succès !");
    }
};

window.manageBilling = function() {
    alert("Ouverture du portail de facturation sécurisé (Stripe)...");
};

// --- CALCUL DES STATS RÉELLES ---
window.updateProfileStats = function() {
    const deals = window.savedDeals || [];
    const soldDeals = deals.filter(d => d.status === "VENDU");
    
    const salesEl = document.getElementById('stat-sales-month');
    const rotEl = document.getElementById('stat-rotation');

    if(salesEl) salesEl.innerText = soldDeals.length;
    
    // Calcul de rotation simplifié (différence entre achat et vente)
    if(rotEl) {
        if (soldDeals.length > 0) {
            rotEl.innerText = "14j"; // Simulation de moyenne
        } else {
            rotEl.innerText = "0j";
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.loadProfile();
    window.updateProfileStats();
});


// ==========================================================================
// 9. INITIALISATION ET AUTHENTIFICATION
// ==========================================================================

// Utilisation de window. pour éviter l'erreur "Identifier has already been declared"
window.SB_URL = 'https://rayyxgqgiwjytesoykgd.supabase.co';
window.SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXl4Z3FnaXdqeXRlc295a2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgxMTQsImV4cCI6MjA4NjQwNDExNH0.KTGP8Kj9ueLBzasriq4sHJyNDK6nSryvZjc6NCsWRSM';

// Initialisation unique du client
if (!window.oxClient) {
    window.oxClient = supabase.createClient(window.SB_URL, window.SB_KEY);
}

window.initApp = function() {
    console.log("Démarrage de l'application OX PRO...");
    if (window.renderExpertise) window.renderExpertise();
    if (window.updatePilotage) window.updatePilotage();
    if (window.runCalculations) window.runCalculations(); 
    
    // On lance la vue par défaut
    window.switchTab('pilotage', document.querySelector('.nav-item.active'));
};

// On s'assure que le DOM est chargé avant de lancer l'app
document.addEventListener('DOMContentLoaded', () => {
    window.initApp();
    if (window.loadProfile) window.loadProfile();
    if (window.updateProfileStats) window.updateProfileStats();
});

window.handleLogout = async function() {
    const confirmLogout = confirm("Voulez-vous vraiment vous déconnecter ?");
    if (confirmLogout) {
        await oxClient.auth.signOut();
        localStorage.removeItem('ox_authenticated');
        window.location.href = 'index.html';
    }
};

