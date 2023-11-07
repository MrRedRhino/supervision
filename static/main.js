class NoTimeDate {
    year;
    month;
    day;

    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    toString() {
        return this.day + "." + this.month + "." + this.year;
    }
}

let name = localStorage.getItem("name") || "";
const namePopup = document.getElementById("name-popup");
let entries = {};
const popup = document.getElementById("popup");
const popupBackground = document.getElementById("popup-background");
let popupDate;
const tiles = {};
const monthWrapper = document.getElementById("month-wrapper");
const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember"
];
const dayNames = [
    "So",
    "Mo",
    "Di",
    "Mi",
    "Do",
    "Fr",
    "Sa"
];

function showPopup(date) {
    popupDate = date;
    popup.hidden = false;
    popupBackground.style.pointerEvents = "unset";
    document.getElementById("popup-date").innerText = `${date.day}.${date.month}.${date.year}`;

    const entry = entries[date];
    document.getElementById("break-1").innerText = "";
    document.getElementById("break-1-button").innerText = "Eintragen";
    document.getElementById("break-1-button").disabled = false;
    document.getElementById("break-1-button").onclick = async () => doSignIn(date, 1, true);

    document.getElementById("break-2").innerText = "";
    document.getElementById("break-2-button").innerText = "Eintragen";
    document.getElementById("break-2-button").disabled = false;
    document.getElementById("break-2-button").onclick = async () => doSignIn(date, 2, true);

    if (entry !== undefined) {
        if (entry["1"]) {
            document.getElementById("break-1").innerText = "- " + entry["1"].join("\n- ");
            const signIn1 = !entry["1"].includes(name);
            document.getElementById("break-1-button").innerText = signIn1 ? "Eintragen" : "Austragen";
            document.getElementById("break-1-button").disabled = !entry["1"].includes(name) && entry["1"].length >= 2;
            document.getElementById("break-1-button").onclick = async () => doSignIn(date, 1, signIn1);
        }

        if (entry["2"]) {
            document.getElementById("break-2").innerText = "- " + entry["2"].join("\n- ");
            const signIn2 = !entry["2"].includes(name);
            document.getElementById("break-2-button").innerText = signIn2 ? "Eintragen" : "Austragen";
            document.getElementById("break-2-button").disabled = !entry["2"].includes(name) && entry["2"].length >= 2;
            document.getElementById("break-2-button").onclick = async () => doSignIn(date, 2, signIn2);
        }
    }
}

function hidePopup() {
    popupDate = null;
    popup.hidden = true;
    popupBackground.style.pointerEvents = "none";
    document.getElementById("supervisions-popup").hidden = true;
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function isCurrentDay(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
}

function createMonth(year, month, scroll = false) {
    const header = document.createElement("h1");
    const d = new Date(year, month);
    header.innerText = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    header.classList.add("month-name");
    monthWrapper.appendChild(header);

    const daysWrapper = document.createElement("div");
    daysWrapper.classList.add("days-wrapper");
    monthWrapper.appendChild(daysWrapper);

    let placeholders = new Date(year, month, 1).getDay() - 1;
    for (let i = 0; i < placeholders; i++) {
        daysWrapper.appendChild(createTile(
            "",
            false,
            true,
            false
        ));
    }

    for (let i = 1; i <= getDaysInMonth(year, month); i++) {
        const date = new Date(year, month, i);

        const dayElement = document.createElement("div");
        dayElement.classList.add("day-wrapper");

        const isWeekend = date.getDay() === 6 || date.getDay() === 0;

        const tile = createTile(
            `${dayNames[date.getDay()]} ${date.getDate()}`,
            isWeekend,
            false,
            isCurrentDay(date)
        );
        const d = new NoTimeDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
        tile.onclick = () => showPopup(d);

        daysWrapper.appendChild(tile);
        tiles[d] = tile.getElementsByTagName("h2");
    }

    if (scroll) {
        header.scrollIntoView(true);

    }
}

function createTile(title, weekend, placeholder, currentDay) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day-wrapper");

    const h1 = document.createElement("h1");
    dayElement.appendChild(h1);
    h1.innerText = title;

    const data = document.createElement("div");
    data.classList.add("data-wrapper")
    dayElement.appendChild(data);

    const break1 = document.createElement("h2");
    data.appendChild(break1);

    const break2 = document.createElement("h2");
    data.appendChild(break2);

    if (currentDay) dayElement.classList.add("current-day");
    if (weekend) dayElement.classList.add("weekend");
    if (placeholder) dayElement.classList.add("placeholder");
    return dayElement;
}

for (let i = -2; i < 8; i++) {
    createMonth(2023, 10 + i, i === -1);
}

async function updateCalendar() {
    await fetch("/api/supervisions").then(r => r.json().then(json => {
        entries = {};
        for (let tile in tiles) {
            tiles[tile][0].innerText = "";
            tiles[tile][1].innerText = "";
        }

        for (let key in json) {
            const split = key.split("-");
            const year = parseInt(split[0]);
            const month = parseInt(split[1])
            const day = parseInt(split[2]);

            const date = new NoTimeDate(year, month, day);
            const data = tiles[date];

            const entry = json[key];
            for (let name of entry["1"] || []) {
                data[0].innerText += `1: ${name}\n`;
            }

            for (let name of entry["2"] || []) {
                data[1].innerText += `2: ${name}\n`;
            }
            entries[date] = entry;
        }
    }));
}

updateCalendar().then();

async function doSignIn(date, breakNum, signIn) {
    const encodedName = encodeURIComponent(name);
    const dateString = `${date.year}-${date.month}-${date.day}`;
    await fetch(`/api/supervisions/${dateString}?break=${breakNum}&name=${encodedName}`, {
        method: signIn ? "PUT" : "DELETE"
    });

    await updateCalendar();
    showPopup(date);
}

function onNameChange(element) {
    const value = element.value;
    const button = document.getElementById("save-button");
    const nameList = document.getElementById("name-list");
    button.disabled = true;
    fetch("/api/names?filter=" + encodeURIComponent(value)).then(r => r.json().then(json => {
        if (json.includes(value)) {
            button.disabled = false;
        }

        nameList.innerHTML = "";

        for (let i = 0; i < Math.min(3, json.length); i++) {
            const n = json[i];
            const li = document.createElement("li");
            li.innerText = n;
            li.onclick = () => {
                element.value = n;
                onNameChange(element);
            }
            nameList.appendChild(li);
        }
    }));
}

function saveName() {
    const value = document.getElementById("name-input").value;
    localStorage.setItem("name", value);
    name = value;
    namePopup.hidden = true;
}

if (name === "") {
    showNamePopup();
}

function showNamePopup() {
    document.getElementById("name-input").value = name;
    namePopup.hidden = false;
}

function showSupervisionsPopup() {
    popupBackground.style.pointerEvents = "unset";
    document.getElementById("supervisions-popup").hidden = false;
    fetch("/api/supervisions/" + encodeURIComponent(name)).then(r => r.json().then(json => {
        const list = document.getElementById("supervisions-list");
        list.innerHTML = "";

        let count = 0;
        for (let entry of json) {
            if (count++ > 8) break;

            const li = document.createElement("li");
            const date = new Date(entry["date"]);
            if (date > new Date()) {
                li.innerText = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + ": ";

                const a = document.createElement("a");
                a.innerText = `${entry["break-num"]}. Pause`;
                li.appendChild(a);
                list.appendChild(li);
            }
        }
    }));
}

document.body.onscroll = () => {
    const scrollTop = document.body.scrollTop;
    const element = findCurrentMonthHeader(scrollTop);

    const h1 = document.getElementById("floating-month-name");
    if (element.offsetTop - scrollTop < 0) {
        h1.hidden = false;
        h1.innerText = element.innerText;
    } else {
        h1.hidden = true;
    }
}

function findCurrentMonthHeader(scroll) {
    let previousElement = null;
    for (let element of monthWrapper.getElementsByClassName("month-name")) {
        if (scroll < element.offsetTop - 120) {
            return previousElement;
        }
        previousElement = element;
    }
}
