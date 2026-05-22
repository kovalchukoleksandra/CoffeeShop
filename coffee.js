const API_URL = "https://coffeeshop-ez6x.onrender.com";
let items = [];
let newsData = [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null; 
let displayedNewsCount = 2; 
let lastResult = [];
let cart = [];
let currentEditId = null;
window.addEventListener("DOMContentLoaded", async () => {
    await fetchItems(); 
    await fetchNews();  
    updateUIByRole();   
    renderCart();       
});

async function fetchItems() {
    try {
        let response = await fetch(`${API_URL}/items`);
        items = await response.json(); 
        lastResult = [...items];
        renderItems(lastResult);
        drawCharts(); 
    } catch (err) {
        console.error("Помилка завантаження товарів:", err);
    }
}

async function fetchNews() {
    try {
        let response = await fetch(`${API_URL}/newsData`);
        if (response.ok) {
            newsData = await response.json();
        } else {
            newsData = [
                { title: "Знижки!", text: "-20% на каву", status: "very", date: "2026-03-20 10:30" },
                { title: "Нові пропозиції", text: "Чай Матча вже у продажу", status: "important", date: "2026-03-21 09:15" }
            ];
        }
        renderNews();
    } catch (err) {
        console.error("Помилка завантаження новин:", err);
    }
}


function renderItems(data) {
    const container = document.getElementById("products");
    if (!container) return;
    container.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        let htmlContent = `
            <img src="${item.img}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.price} грн</p>
            <p style="font-size: 0.85em; color: #666;">Популярність: ${item.popularity || 0} 🔥</p>
            <button onclick="toggleDesc(this)">Деталі</button>
            <p class="hidden">${item.desc}</p>
            <button onclick="simpleAddToCart('${item.name}', ${item.price})">Купити</button>
        `;

        if (currentUser && currentUser.role === "admin") {
    htmlContent += `
        <div class="admin-actions" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 8px; display: flex; gap: 8px; justify-content: center;">
            <button onclick="openEditModal('${item.id}')" style="background: #ffd452; color: black; border: none; padding: 10px 10px; cursor: pointer; font-weight: bold; border-radius: 10px;">Редагувати </button>
            <button onclick="deleteItem('${item.id}')" style="background: #db4756; color: white; border: none; padding: 10px 10px; cursor: pointer; border-radius: 10px;">Видалити </button>
        </div>
    `;
}

        card.innerHTML = htmlContent;
        container.appendChild(card);
    });
}

async function deleteItem(id) {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!confirm("Ви дійсно хочете видалити цей товар?")) return;

    try {
        let response = await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
        if (response.ok) {
            await fetchItems(); 
        }
    } catch (err) {
        console.error("Не вдалося видалити товар:", err);
    }
}

async function addNewItem(name, type, price, img, desc) {
    if (!currentUser || currentUser.role !== "admin") return;

    const newItem = { name, type, price: +price, img, desc, popularity: 0 };

    try {
        let response = await fetch(`${API_URL}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem)
        });
        if (response.ok) await fetchItems();
    } catch (err) {
        console.error("Помилка додавання товару:", err);
    }
}

async function register() {
    const login = document.getElementById("reg-login").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const repeat = document.getElementById("reg-repeat").value;
    const message = document.getElementById("register-message");

    message.innerText = "";
    message.style.color = "red";

    if (!login || !email || !password || !repeat) {
        message.innerText = "Помилка: Усі поля (Логін, Email, Пароль, Повтор) є обов'язковими для заповнення!";
        return;
    }

    if (password.length < 6) {
        message.innerText = "Помилка: Пароль надто короткий (мінімум 6 символів)!";
        return;
    }

    const hasNumber = /\d/.test(password); 
    const hasLetter = /[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ]/.test(password); 

    if (!hasNumber || !hasLetter) {
        message.innerText = "Помилка: Пароль повинен містити хоча б одну букву та хоча б одну цифру!";
        return;
    }

    if (password !== repeat) {
        message.innerText = "Помилка: Введені паролі не збігаються!";
        return;
    }

    try {
        let response = await fetch(`${API_URL}/users`);
        let dbUsers = await response.json();
        
        const exists = dbUsers.find(u => u.login.toLowerCase() === login.toLowerCase());
        if (exists) {
            message.innerText = "Помилка: Користувач з таким логіном вже зареєстрований!";
            return;
        }

        let createResponse = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, email, password, role: "user" })
        });

        if (createResponse.ok) {
            message.style.color = "green";
            message.innerText = "Реєстрація успішна! Тепер ви можете увійти.";
            setTimeout(() => { showLogin(); }, 1500);
        }
    } catch (err) {
        message.innerText = "Помилка з'єднання з сервером.";
    }
}

async function login() {
    const loginInput = document.getElementById("login-name") ? document.getElementById("login-name").value.trim() : "";
    const passwordInput = document.getElementById("login-password") ? document.getElementById("login-password").value : "";
    const message = document.getElementById("login-message") || document.getElementById("register-message");

    if (!message) return;
    message.innerText = "";

    try {
        let response = await fetch(`${API_URL}/users`);
        let dbUsers = await response.json();
        const foundUser = dbUsers.find(u => u.login === loginInput && u.password === passwordInput);

        if (foundUser) {
            message.style.color = "green";
            message.innerText = "Авторизація успішна! Вітаємо.";

            currentUser = { login: foundUser.login, role: foundUser.role, email: foundUser.email };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));

            setTimeout(() => {
                closeModal();
                updateUIByRole();
            }, 1000);
        } else {
            message.style.color = "red";
            message.innerText = "Неправильний логін або пароль. Доступ відхилено.";
        }
    } catch (err) {
        console.error(err);
    }
}

function updateUIByRole() {
    const adminPanel = document.getElementById("admin-panel"); 
    const authBtn = document.getElementById("auth-btn");
    if (adminPanel) adminPanel.classList.add("hidden");

    let addBtn = document.getElementById("admin-add-btn");

    renderItems(lastResult);

    if (currentUser) {
        console.log(`Увійшов користувач з роллю: ${currentUser.role}`);
        
        if (authBtn) {
            authBtn.innerText = `Вийти (${currentUser.login})`;
            authBtn.setAttribute("onclick", "logout()");
        }
        if (currentUser.role === "admin") {
            if (!addBtn && authBtn) {
                addBtn = document.createElement("button");
                addBtn.id = "admin-add-btn";
                addBtn.innerText = "Додати товар";
                addBtn.style.backgroundColor = "#8b5e3c"; 
                addBtn.style.color = "white";
                addBtn.style.marginRight = "10px";
                addBtn.style.cursor = "pointer";
                addBtn.setAttribute("onclick", "toggleAdminPanel()");
    
                authBtn.parentNode.insertBefore(addBtn, authBtn);
            }
        } else {

            if (addBtn) addBtn.remove();
        }
    } else {
        console.log("Користувач не авторизований (Гість)");
        if (authBtn) {
            authBtn.innerText = "Увійти";
            authBtn.setAttribute("onclick", "openModal()");
        }
        if (addBtn) addBtn.remove();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    cart = [];          
    renderCart();      
    
    updateUIByRole();
}
function simpleAddToCart(name, price) {
    const existing = cart.find(i => i.name === name);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name: name, price: price, qty: 1 });
    }

    renderCart();

    const cartBlock = document.getElementById("cart");
    if (cartBlock) {
        cartBlock.classList.remove("hidden");
    }
}

function sendOrder() {
    if (cart.length === 0) return;
    if (!currentUser) {
        alert("Оформлення замовлення доступне тільки для зареєстрованих клієнтів! Будь ласка, авторизуйтесь.");
        toggleCart(); 
        openModal();  
        showLogin();
        return;
    }

    const infoContainer = document.getElementById("order-info");
    const totalSum = document.getElementById("total").innerText;
    const orderList = cart.map(item => `<li>${item.name} — ${item.qty} шт.</li>`).join("");

    if (infoContainer) {
        infoContainer.innerHTML = `
            <p>Дякуємо, <strong>${currentUser.login}</strong>! Ви замовили:</p>
            <ul>${orderList}</ul>
            <p><strong>${totalSum}</strong></p>
        `;
    }

    cart.forEach(cartItem => {
        const dbItem = items.find(i => i.name === cartItem.name);
        if (dbItem) {
            dbItem.popularity = (dbItem.popularity || 0) + cartItem.qty;
        }
    });

    lastResult = [...items];

    const orderModal = document.getElementById("order-modal");
    if (orderModal) orderModal.classList.remove("hidden");

    toggleCart(); 
}

function drawCharts() {
    const canvas = document.getElementById("myCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const chartType = document.getElementById("chart-type").value;
    const data = lastResult;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) {
        ctx.fillStyle = "#000";
        ctx.fillText("Немає даних для аналізу", 250, 200);
        return;
    }

    if (chartType === "bar") {
        const maxPopularity = Math.max(...data.map(i => i.popularity || 0)) || 1;
        data.forEach((item, i) => {
            const currentPop = item.popularity || 0;
            const h = (currentPop / maxPopularity) * 250; 
            const x = 60 + i * 110;
            const y = 330 - h;

            ctx.fillStyle = "#8b5e3c";
            ctx.fillRect(x, y, 60, h); 

            ctx.fillStyle = "#333";
            ctx.font = "bold 12px Arial";
            ctx.fillText(currentPop + " 🔥", x + 15, y - 10); 
            ctx.fillText(item.name.substring(0, 10), x, 350); 
        });

    } else if (chartType === "pie") {
        const stats = data.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + (item.popularity || 0);
            return acc;
        }, {});

        let lastAngle = 0;
        const colors = { "coffee": "#6F4E37", "tea": "#50C878" }; 
        const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;

        Object.keys(stats).forEach((type) => {
            const angle = (stats[type] / total) * Math.PI * 2;
            if (angle === 0) return;
            
            ctx.fillStyle = colors[type] || "#ccc";
            ctx.beginPath();
            ctx.moveTo(300, 180);
            ctx.arc(300, 180, 110, lastAngle, lastAngle + angle);
            ctx.fill();

            const midAngle = lastAngle + angle / 2;
            const tx = 300 + Math.cos(midAngle) * 140;
            const ty = 180 + Math.sin(midAngle) * 140;
            
            ctx.fillStyle = "#333";
            ctx.font = "bold 12px Arial";
            const percent = Math.round((stats[type] / total) * 100);
            ctx.fillText(`${type.toUpperCase()} (${percent}%)`, tx - 30, ty);

            lastAngle += angle;
        });

    } else if (chartType === "line") {
        const maxPopularity = Math.max(...data.map(i => i.popularity || 0)) || 1;
       
        ctx.beginPath(); 
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#8b5e3c";

        data.forEach((item, i) => {
            const currentPop = item.popularity || 0;
            const x = 80 + i * 150;
            const y = 330 - (currentPop / maxPopularity) * 250;

            if (i === 0) ctx.moveTo(x, y); 
            else ctx.lineTo(x, y);         
        });
        ctx.stroke(); 

        data.forEach((item, i) => {
            const currentPop = item.popularity || 0;
            const x = 80 + i * 150;
            const y = 330 - (currentPop / maxPopularity) * 250;

            ctx.fillStyle = "#5d3a1a";
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#333";
            ctx.font = "12px Arial";
            ctx.fillText(currentPop + " 🔥", x - 10, y - 15);
            ctx.fillText(item.name, x - 20, 350);
        });
    }
}


function applyFilters() {
    const type = document.getElementById("filter").value;
    const sort = document.getElementById("sort").value;
    const min = +document.getElementById("minPrice").value || 0;
    const max = +document.getElementById("maxPrice").value || Infinity;
    const search = document.getElementById("search").value.toLowerCase();

    let result = items.filter(i => 
        (type === "all" || i.type === type) &&
        (i.price >= min && i.price <= max) &&
        (i.name.toLowerCase().includes(search))
    );

    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") result.sort((a, b) => a.price - b.price);

    lastResult = result; 
    renderItems(result);
    drawCharts();        
}

function toggleDesc(btn) {
    btn.nextElementSibling.classList.toggle("hidden");
}

function renderNews() {
    const titlesContainer = document.getElementById("news-titles");
    if (!titlesContainer) return;
    titlesContainer.innerHTML = "";
    const sortedNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
    const newsToShow = sortedNews.slice(0, displayedNewsCount);

    newsToShow.forEach((n) => {
        const div = document.createElement("div");
        div.className = `news-title-item ${n.status}`;
        
        const time = n.date.includes(" ") ? n.date.split(" ")[1] : "00:00"; 
        div.innerHTML = `
            <span>${time}</span>
            <div class="title-text">${n.title}</div>
        `;

        div.onclick = () => {
            document.querySelectorAll('.news-title-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            showNewsBody(n);
        };
        titlesContainer.appendChild(div);
    });

    const loadMoreBtn = document.getElementById("load-more-news");
    if (loadMoreBtn) {
        loadMoreBtn.style.display = displayedNewsCount >= newsData.length ? "none" : "block";
    }
}

function showNewsBody(news) {
    const contentArea = document.getElementById("active-news-body");
    if (contentArea) {
        contentArea.innerHTML = `
            <h3>${news.title}</h3>
            <p style="color: gray; font-size: 0.8em;">Дата: ${news.date}</p>
            <hr>
            <p>${news.text}</p>
        `;
    }
}

function loadMoreNews() {
    displayedNewsCount += 2; 
    renderNews();
}

function toggleCart() {
    document.getElementById("cart").classList.toggle("hidden");
}

function renderCart() {
    const container = document.getElementById("cart-items");
    if (!container) return;

    let total = 0;

    container.innerHTML = cart.map((item, index) => {
        const sum = item.price * item.qty;
        total += sum;

        return `
            <li class="cart-item">
                <span class="name">${item.name}</span>
                <span class="price">
                    <span class="price-text">${item.price} грн ×</span>
                    <input type="number" min="1" value="${item.qty}" onchange="changeQty(${index}, this.value)">
                </span>
                <span class="sum">${sum} грн</span>
                <span onclick="removeFromCart(${index})" class="remove-btn">✖</span>
            </li>
        `;
    }).join("");

    const totalEl = document.getElementById("total");
    if (totalEl) totalEl.innerText = "Разом: " + total + " грн";
    
    const btn = document.getElementById("checkout-btn");
    if (btn) btn.disabled = cart.length === 0;
}

function changeQty(index, value) {
    cart[index].qty = +value;
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function openModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.remove("hidden");
    const loginMsg = document.getElementById("login-message");
    if (loginMsg) loginMsg.innerText = "";

    const regMsg = document.getElementById("register-message");
    if (regMsg) regMsg.innerText = "";
}

function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
}

function showRegister() {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
}

async function closeOrderModal() {
    const orderModal = document.getElementById("order-modal");
    if (orderModal) orderModal.classList.add("hidden");

    const completedCart = [...cart];
    cart = [];
    renderCart();

    renderItems(lastResult);
    drawCharts();

    try {
        for (const cartItem of completedCart) {
            const dbItem = items.find(i => i.name === cartItem.name);
            if (dbItem) {
                await fetch(`${API_URL}/items/${dbItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: dbItem.name,
                        type: dbItem.type,
                        price: dbItem.price,
                        img: dbItem.img,
                        desc: dbItem.desc,
                        popularity: dbItem.popularity 
                    })
                });
            }
        }
    } catch (err) {
        console.error("Помилка фонового збереження популярності:", err);
    }
}
function toggleAdminPanel() {
    const adminPanel = document.getElementById("admin-panel");
    if (!adminPanel) return;

    currentEditId = null;

    const form = document.getElementById("add-product-form");
    if (form) form.reset();

    const titleEl = document.getElementById("admin-panel-title");
    if (titleEl) titleEl.innerText = "Новий товар ";

    const submitBtn = document.getElementById("admin-submit-btn");
    if (submitBtn) {
        submitBtn.innerText = "Зберегти та додати ";
        submitBtn.style.backgroundColor = "#28a745"; 
        submitBtn.style.color = "white";
    }

    adminPanel.classList.toggle("hidden");
}
function openEditModal(id) {
    const adminPanel = document.getElementById("admin-panel");
    if (!adminPanel) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    currentEditId = id; 

    document.getElementById("prod-name").value = item.name;
    document.getElementById("prod-type").value = item.type;
    document.getElementById("prod-price").value = item.price;
    document.getElementById("prod-img").value = item.img;
    document.getElementById("prod-desc").value = item.desc;

    document.getElementById("admin-panel-title").innerText = `Редагування: ${item.name} `;
    
    const submitBtn = document.getElementById("admin-submit-btn");
    submitBtn.innerText = "Зберегти зміни ";
    submitBtn.style.backgroundColor = "#28a745"; 
    submitBtn.style.color = "white";

    adminPanel.classList.remove("hidden");
}

async function handleAdminSubmit(event) {
    if (event && event.preventDefault) event.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
        alert("У вас немає прав!");
        return;
    }

    const name = document.getElementById("prod-name").value.trim();
    const type = document.getElementById("prod-type").value;
    const price = +document.getElementById("prod-price").value;
    const img = document.getElementById("prod-img").value.trim();
    const desc = document.getElementById("prod-desc").value.trim();

    if (!name || !price || !img || !desc) {
        alert("Будь ласка, заповніть усі поля форми!");
        return;
    }

if (currentEditId) {
    try {
        const originalItem = items.find(i => i.id === currentEditId);
        const currentPopularity = originalItem ? (originalItem.popularity || 0) : 0;

        let response = await fetch(`${API_URL}/items/${currentEditId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type, price, img, desc, popularity: currentPopularity }) 
        });
            
            if (response.ok) {
                alert(`Товар "${name}" успішно оновлено!`);
                await fetchItems(); 
            } else {
                alert("Не вдалося зберегти зміни на сервері.");
            }
        } catch (err) {
            console.error("Помилка редагування товару:", err);
            alert("Сталася помилка з'єднання з сервером.");
        }
    } else {
        await addNewItem(name, type, price, img, desc);
        alert(`Товар "${name}" успішно додано!`);
    }

    currentEditId = null;
    document.getElementById("add-product-form").reset();
    document.getElementById("admin-panel").classList.add("hidden");
}
const searchInput = document.getElementById("search");
if (searchInput) searchInput.addEventListener("input", applyFilters);

const chartTypeSelect = document.getElementById("chart-type");
if (chartTypeSelect) chartTypeSelect.addEventListener("change", drawCharts);
