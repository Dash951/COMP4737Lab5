const API_BASE_URL = "https://rajansidhu-comp4537.duckdns.org/lab5/api/v1/sql";

const MESSAGES = {
    pageTitle: "Patient Records",
    pageHeading: "Patient Records",
    insertButton: "Insert",
    queryLabel: "SQL query",
    queryButton: "Submit",
    defaultQuery: "SELECT * FROM patient",
    responseHeading: "Response",
    working: "Contacting the server...",
    emptyQuery: "Type a SQL query before submitting.",
    networkError: "The server could not be reached."
};

const SAMPLE_PATIENTS = [
    { name: "Sara Brown", dateOfBirth: "1981-01-01" },
    { name: "John Smith", dateOfBirth: "1941-01-01" },
    { name: "Jack Ma", dateOfBirth: "1961-01-30" },
    { name: "Elon Musk", dateOfBirth: "1999-01-01" }
];
