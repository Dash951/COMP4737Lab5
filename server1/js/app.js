// DISCLOSURE: AI was used to aid in the development of this code.

class Patient {
    constructor(name, dateOfBirth) {
        this.name = name;
        this.dateOfBirth = dateOfBirth;
    }
}

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
    }

    insertPatients(patients) {
        return this.send(this.baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patients)
        });
    }

    runQuery(sql) {
        const address = this.baseUrl + "/" + encodeURIComponent(sql);
        return this.send(address, { method: "GET" });
    }

    async send(address, options) {
        let response;
        try {
            response = await fetch(address, options);
        } catch {
            throw new Error(MESSAGES.networkError);
        }

        const text = await response.text();
        let body = {};
        if (text) {
            try {
                body = JSON.parse(text);
            } catch {
                body = { message: text };
            }
        }

        return { ok: response.ok, status: response.status, body: body };
    }
}

class ResultPanel {
    constructor(outputEl) {
        this.outputEl = outputEl;
    }

    showText(text) {
        this.outputEl.textContent = text;
    }

    showResponse(payload) {
        this.outputEl.textContent = JSON.stringify(payload.body, null, 2);
    }
}

class PatientPage {
    constructor() {
        this.api = new ApiClient(API_BASE_URL);
        this.patients = SAMPLE_PATIENTS.map((row) => new Patient(row.name, row.dateOfBirth));
        this.insertButton = document.getElementById("insertButton");
        this.queryButton = document.getElementById("queryButton");
        this.queryBox = document.getElementById("queryBox");
        this.panel = new ResultPanel(document.getElementById("responseRaw"));
        this.busy = false;
    }

    start() {
        this.fillText();
        this.insertButton.addEventListener("click", () => {
            this.onInsert();
        });
        this.queryButton.addEventListener("click", () => {
            this.onQuery();
        });
    }

    fillText() {
        document.title = MESSAGES.pageTitle;
        document.getElementById("pageHeading").textContent = MESSAGES.pageHeading;
        document.getElementById("queryLabel").textContent = MESSAGES.queryLabel;
        document.getElementById("responseHeading").textContent = MESSAGES.responseHeading;
        this.insertButton.textContent = MESSAGES.insertButton;
        this.queryButton.textContent = MESSAGES.queryButton;
        this.queryBox.value = MESSAGES.defaultQuery;
    }

    setBusy(isBusy) {
        this.busy = isBusy;
        this.insertButton.disabled = isBusy;
        this.queryButton.disabled = isBusy;
    }

    async onInsert() {
        if (this.busy) {
            return;
        }
        this.setBusy(true);
        this.panel.showText(MESSAGES.working);
        try {
            const result = await this.api.insertPatients(this.patients);
            this.panel.showResponse(result);
        } catch (err) {
            this.panel.showText(err.message);
        }
        this.setBusy(false);
    }

    async onQuery() {
        const sql = this.queryBox.value.trim();
        if (!sql) {
            this.panel.showText(MESSAGES.emptyQuery);
            return;
        }
        if (this.busy) {
            return;
        }
        this.setBusy(true);
        this.panel.showText(MESSAGES.working);
        try {
            const result = await this.api.runQuery(sql);
            this.panel.showResponse(result);
        } catch (err) {
            this.panel.showText(err.message);
        }
        this.setBusy(false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PatientPage().start();
});
