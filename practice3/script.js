
const form = document.querySelector('.add-item form');
const input = document.getElementById('item-name');
const itemList = document.querySelector('.item-list ul');
const statsRemaining = document.querySelector('.remaining ul');
const statsPurchased = document.querySelector('.purchased ul');
const ITEMS_STORAGE_KEY = 'buyListItems';


// ===== INITIAL ============================================================
const initialItems = [
    { name: 'Tomatoes', quantity: 2, purchased: false },
    { name: 'Cookies',  quantity: 3, purchased: true  },
    { name: 'Cheese',   quantity: 1, purchased: true  },
];


// ===== ALL ITEMS =============================================================
const itemMap = new Map(initialItems.map(item => [item.name, item]));

for (const item of (loadItemsFromStorage() || [])) {
    itemMap.set(item.name, item);
}

for (const item of itemMap.values()) {
    createItem(item.name, item.quantity || 1, item.purchased);
}


// ===== FORM =============================================================
form.addEventListener('submit', event => {
    event.preventDefault();
    const name = input.value.trim();

    if (name) {
        const existingNames = new Set(
            Array.from(itemList.querySelectorAll('.item-name')).map(span =>
                span.textContent.trim().toLowerCase()
            )
        );

        if (existingNames.has(name.toLowerCase())) alert(`Товар "${name}" вже є у списку!`);
        else createItem(name, 1, true);

        input.value = '';
        input.focus();
    }
});


// ===== CREATE ITEM ===========================================================
function createItem(name, quantity = 1, purchased = false) {
    const li = document.createElement('li');
    li.className = 'item';

    let nameSpan = createNameSpan(name, purchased);
    const counter = createCounter(quantity, purchased);
    const purchaseControls = createPurchaseSection(purchased);

    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';
    itemContent.appendChild(counter.container);
    itemContent.appendChild(purchaseControls.container);

    li.appendChild(nameSpan);
    li.appendChild(itemContent);

    if (purchased) {
        setupDeleteButton(li, purchaseControls.container);
        enableItemNameEditing(nameSpan, newSpan => nameSpan = newSpan);
    }

    itemList.appendChild(li);

    updateQuantity(counter, purchaseControls);
    updatePurchase(purchaseControls, nameSpan, counter, li);
    updateStatistics();
}


// ===== ITEM NAME ====================================================
function createNameSpan(name, isPurchased) {
    const span = document.createElement('span');
    span.className = 'item-name' + (isPurchased ? '' : ' bought');
    span.textContent = name;
    return span;
}

// ---- IF NOT PURCHASE ----------------------------------------------
function enableItemNameEditing(span, onUpdate) {
    span.addEventListener('click', () => {
        const currentText = span.textContent;
        const input = document.createElement('input');

        input.type = 'text';
        input.value = currentText;
        input.className = span.className;
        span.replaceWith(input);
        input.focus();

        input.addEventListener('blur', () => {
            const newSpan = document.createElement('span');

            newSpan.textContent = input.value.trim() || currentText;
            newSpan.className = input.className;
            input.replaceWith(newSpan);
            onUpdate(newSpan);

            updateStatistics();
            enableItemNameEditing(newSpan, onUpdate);
        });
    });
}


// ===== ITEM COUNT ====================================================
function createCounter(quantity, purchased) {
    const container = document.createElement('div');
    container.className = 'counter';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'quantity-btn quantity-btn-minus tooltip-btn' + (purchased ? '' : ' not-purchased');
    minusBtn.setAttribute('data-tooltip', 'Decrease');
    minusBtn.textContent = '-';

    const count = document.createElement('span');
    count.className = 'count-quantity';
    count.textContent = quantity;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'quantity-btn quantity-btn-plus tooltip-btn' + (purchased ? '' : ' not-purchased');
    plusBtn.setAttribute('data-tooltip', 'Increase');
    plusBtn.textContent = '+';

    container.appendChild(minusBtn);
    container.appendChild(count);
    container.appendChild(plusBtn);

    return {container, minusBtn, count, plusBtn};
}

// ---- UPDATE ---------------------------------------------------------
function updateQuantity(counter, purchaseControls) {
    const updateMinusButton = () => {
        counter.minusBtn.disabled = parseInt(counter.count.textContent, 10) <= 1;
    };

    const update = (number) => {
        if (purchaseControls.toggle.getAttribute('aria-pressed') !== 'true') return;
        let count = parseInt(counter.count.textContent, 10) + number;
        if (count < 1) return;
            counter.count.textContent = count;
            updateMinusButton();
            updateStatistics();
    };

    counter.plusBtn.addEventListener('click', () => update(1));
    counter.minusBtn.addEventListener('click', () => update(-1));
}


// ===== IS PURCHASE ===================================================
function createPurchaseSection(purchased) {
    const container = document.createElement('div');
    container.className = 'item-purchase';

    const toggle = document.createElement('button');
    toggle.className = 'toggle tooltip-btn';
    toggle.setAttribute('aria-pressed', purchased);
    toggle.setAttribute('data-tooltip', purchased ? 'Mark as purchased' : 'Mark as not purchased');
    toggle.textContent = purchased ? 'Not purchased' : 'Purchased';

    container.appendChild(toggle);
    return {container, toggle};
}

// ---- UPDATE ---------------------------------------------------------
function updatePurchase(purchaseControls, nameSpan, counter, li) {
    purchaseControls.toggle.addEventListener('click', () => {
        const isPurchased = purchaseControls.toggle.getAttribute('aria-pressed') === 'true';

        purchaseControls.toggle.setAttribute('aria-pressed', !isPurchased);
        purchaseControls.toggle.textContent = !isPurchased ? 'Not purchased' : 'Purchased';
        purchaseControls.toggle.setAttribute('data-tooltip', !isPurchased ? 'Mark as purchased' : 'Mark as not purchased');

        nameSpan.classList.toggle('bought', isPurchased);
        counter.minusBtn.classList.toggle('not-purchased', isPurchased);
        counter.plusBtn.classList.toggle('not-purchased', isPurchased);

        if (!isPurchased) {
            setupDeleteButton(li, purchaseControls.container);
            enableItemNameEditing(nameSpan, newSpan => nameSpan = newSpan);
        } else {
            removeDeleteButton(li);

            const newSpan = nameSpan.cloneNode(true);
            nameSpan.replaceWith(newSpan);
            nameSpan = newSpan;
        }
        
        updateStatistics();
    });
}

                        
// ===== DELETE ====================================================
function createDeleteButton(li) {
    const btn = document.createElement('button');

    btn.className = 'delete tooltip-btn';
    btn.textContent = 'x';
    btn.setAttribute('aria-label', 'Delete item');
    btn.setAttribute('data-tooltip', 'Delete item');

    btn.addEventListener('click', () => {
        li.remove();
        updateStatistics();
    });

    return btn;
}

function setupDeleteButton(li, container) {
    let btn = li.querySelector('.delete');
    if (!btn) {
        btn = createDeleteButton(li);
        container.appendChild(btn);
    }
}

function removeDeleteButton(li) {
    const btn = li.querySelector('.delete');
    if (btn) btn.remove();
}


// ===== STATISTICS ====================================================
function updateStatistics() {
    const items = itemList.querySelectorAll('li');
    const remaining = new Map();
    const purchased = new Map();

    items.forEach(li => {
        const name = li.querySelector('.item-name').textContent.trim();
        const quantity = parseInt(li.querySelector('.count-quantity').textContent, 10);
        const isPurchased = li.querySelector('.toggle').getAttribute('aria-pressed') === 'false';
        const targetMap = isPurchased ? purchased : remaining;

        targetMap.set(name, (targetMap.get(name) || 0) + quantity);
    });

    createItemsStatistic(remaining, statsRemaining);
    createItemsStatistic(purchased, statsPurchased, 'bought');
    saveItemsToStorage(getArrayOfItems());
}

function createItemsStatistic(items, container, className = '') {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    for (const [name, quantity] of items.entries()) {
        const li = document.createElement('li');
        li.className = 'item-count' + (className ? ' ' + className : '');

        const itemName = document.createTextNode(name + ' ');
        const itemCount = document.createElement('span');
        itemCount.className = 'count-number';
        itemCount.textContent = quantity;

        li.appendChild(itemName);
        li.appendChild(itemCount);
        container.appendChild(li);
    }
}


// ===== STORAGE ====================================================
function saveItemsToStorage(items) {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
}

function loadItemsFromStorage() {
    const data = localStorage.getItem(ITEMS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
}

function getItemInfo(li) {
    const name = li.querySelector('.item-name').textContent.trim();
    const quantity = parseInt(li.querySelector('.count-quantity').textContent, 10);
    const purchased = li.querySelector('.toggle').getAttribute('aria-pressed') === 'true';
    return {name, quantity, purchased};
}

function getArrayOfItems() {
    const result = [];
    for (const li of itemList.querySelectorAll('li')) {
        const item = getItemInfo(li);
        result.push(item);
    }
    return result;
}

