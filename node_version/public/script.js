let CLIENT_ID
let API_KEY

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
];
const SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
];

let tokenClient;
let gapiInited = false;
let gisInited = false;
let startDate = "";
let endDate = "";

document.getElementById("authorize_button").style.visibility = "hidden";

async function fetchEnvVariables() {
    try {
        const respons = await fetch('/test');
        console.log(respons)
        const response = await fetch('/env');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const env = await response.json();
        console.log('Fetched Environment Variables:', env);
        CLIENT_ID = env.clientId;
        API_KEY = env.apiKey;

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES.join(" "),
            callback: "", // defined later
        });
        gisInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error("Error fetching environment variables:", error);
    }
}

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
    fetchEnvVariables()
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
        // document.getElementById("content").innerHTML =
        //     "Schedule has been Pushed To calendar ^^<br>";

        await getRecentEmailFromSender();
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
        // console.log("Event created: ", response.result.htmlLink);
    } catch (err) {
        console.error("Error contacting the Calendar service: ", err.message);
    }
}

async function checkDuplicateEvent(newEvent) {
    const calendar = gapi.client.calendar;

    try {
        // List events within the time range of the new event
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: newEvent.start.dateTime,
            timeMax: newEvent.end.dateTime,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.result.items;

        if (events.length > 0) {
            // Check if any event matches the new event's details
            const duplicateEvent = events.find((event) => {
                // Compare start and end time, allowing for small differences (e.g., due to different time zones)
                const startTimeMatches =
                    Math.abs(
                        new Date(event.start.dateTime) -
                        new Date(newEvent.start.dateTime)
                    ) < 60000; // 1 minute tolerance
                const endTimeMatches =
                    Math.abs(
                        new Date(event.end.dateTime) -
                        new Date(newEvent.end.dateTime)
                    ) < 60000;

                // Compare other details
                return (
                    event.summary === newEvent.summary &&
                    startTimeMatches &&
                    endTimeMatches &&
                    event.location === newEvent.location
                );
            });

            if (duplicateEvent) {
                // Duplicate event found, return an error

                console.log("Duplicate event found. Event not added.");
                return;
            }
        }

        // No duplicate found, add the new event
        await addEvent(newEvent);
        console.log("Event added successfully.");
    } catch (error) {
        console.error("Error checking or adding event:", error.message);
    }
}

async function getRecentEmailFromSender() {
    try {
        // List messages from the specified sender
        const res = await gapi.client.gmail.users.messages.list({
            userId: "me",
            q: `from:noreply@clearviewconnect.com`,
            maxResults: 1,
            orderBy: "date",
        });

        const messages = res.result.messages;
        if (!messages || messages.length === 0) {
            console.log("No message found");
            return;
        }

        // Get the most recent message
        const messageId = messages[0].id;
        const messageRes = await gapi.client.gmail.users.messages.get({
            userId: "me",
            id: messageId,
        });
        const emailData = messageRes.result;
        const encodedBody = emailData.payload.parts
            ? emailData.payload.parts[0].body.data
            : emailData.payload.body.data;

        // Decode the body
        const decodedBody = atob(
            encodedBody.replace(/-/g, "+").replace(/_/g, "/")
        );

        // Extract the schedule details
        const scheduleLines = decodedBody
            .split("\n")
            .filter((line) =>
                line.match(
                    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}:/
                )
            );

        if (scheduleLines.length === 0) {
            console.log("No schedule lines found.");
            return;
        }

        // Parse the schedule lines and add events
        for (const line of scheduleLines) {
            try {
                const event = parseScheduleLine(line);
                if (event) {
                    await checkDuplicateEvent(event);
                    // document.getElementById("content").innerHTML += `${line}`;
                }
            } catch (error) {
                console.error("Error parsing or adding event:", error.message);
            }
            endDate = line.split(":")[0].trim();
        }
        startDate = scheduleLines[0].split(":")[0].trim();
        document.getElementById(
            "content"
        ).innerHTML += `Schedule from ${startDate} to ${endDate} has been Posted on calender`;
    } catch (error) {
        console.error("Error fetching email:", error.message);
    }
}

function parseScheduleLine(line) {
    try {
        // Check for "Not Scheduled" and skip such lines
        if (line.includes("Not Scheduled")) {
            console.log(`Skipping non-scheduled day`);
            return null;
        }

        // Extract date part and time details
        const [datePart, rest] = line.split(/:\s+/);
        const timeAndDetails = rest.trim();

        // Handle specific cases based on structure
        const [timeRange] = timeAndDetails.split(/\s*,\s*/);
        const [startTime, endTime] = timeRange
            .split(" - ")
            .map((time) => time.trim());

        // Extract month and day
        const [month, day] = datePart.split(/\s+/);
        const year = new Date().getFullYear();
        const date = new Date(`${month} ${day}, ${year}`);

        // Convert times to Date objects
        const startDateTime = new Date(date);
        const endDateTime = new Date(date);

        const [startHours, startMinutes] = convertTo24Hour(startTime);
        const [endHours, endMinutes] = convertTo24Hour(endTime);

        startDateTime.setHours(startHours, startMinutes);
        endDateTime.setHours(endHours, endMinutes);

        return {
            summary: `Tim~Shift`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: "America/Halifax",
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: "America/Halifax",
            },
            colorId: "5", // Optional: color ID for the event
        };
    } catch (error) {
        console.error("Error parsing schedule line:", error.message);
        throw new Error("Invalid schedule line format");
    }
}

function convertTo24Hour(time) {
    if (!time) {
        throw new Error("Invalid time format");
    }

    const match = time.match(/(\d{1,2}):(\d{2})(AM|PM)/i);

    if (!match) {
        throw new Error("Time format does not match");
    }

    let [hours, minutes, meridian] = match.slice(1);
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (meridian.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridian.toUpperCase() === "AM" && hours === 12) hours = 0;

    return [hours, minutes];
}

// animation stuff
setTimeout(function() {
    document.getElementById("authorize_button").classList.add("show");
    document.querySelector(".logo").classList.add("slideUp");
}, 2000);
