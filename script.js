const CLIENT_ID =
    "788580741376-h1n2u0s3lsspsvs1u3gistjt900lvtuc.apps.googleusercontent.com";
const API_KEY = "AIzaSyDxVfP2-xB6zDClxXShf8AAQLJAI0dCscA";

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
];
const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.readonly",
];

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hidden";

function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES.join(" "),
        callback: "", // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById("authorize_button").style.visibility =
            "visible";
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error("Error during authorization:", resp);
            return;
        }
        document.getElementById("authorize_button").style.visibility = "hidden";
        document.getElementById("content").textContent =
            "Test Event Has been Pushed To calender ^^";

        // Test event details
        const testEvent = {
            summary: "Test",
            location: "Halifax, NS, Canada",
            start: {
                dateTime: "2024-07-31T15:00:00",
                timeZone: "America/Halifax",
            },
            end: {
                dateTime: "2024-07-31T18:00:00",
                timeZone: "America/Halifax",
            },
            colorId: "11", // Red color
        };

        await addEvent(testEvent);
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
        tokenClient.requestAccessToken({ prompt: "" });
    }
}

async function addEvent(event) {
    try {
        const response = await gapi.client.calendar.events.insert({
            calendarId: "primary",
            resource: event,
        });
        console.log("Event created: ", response.result.htmlLink);
    } catch (err) {
        console.error("Error contacting the Calendar service: ", err.message);
    }
}
