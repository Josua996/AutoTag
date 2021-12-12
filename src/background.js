/**
 * Use the startup phase to tell Thunderbird that it should load
 * our message-content-script.js file whenever a message is displayed
 */
const handleStartup = () => {
    messenger.messageDisplayScripts.register({
        js: [{ file: "/tagToolbar/message-content-script.js" }],
        css: [{ file: "/tagToolbar/message-content-styles.css" }],
    });
};

/**
 * command handler: handles the commands received from the content script
 */
const doHandleCommand = async (message, sender) => {
    console.log("doHandleCommand")

    const { command, data } = message;
    const {
        tab: { id: tabId },
    } = sender;

    const messageHeader = await browser.messageDisplay.getDisplayedMessage(tabId);
    const tags = await messenger.messages.listTags()

    // check for known commands
    switch (command.toLocaleLowerCase()) {
        case "change_tag": {
            let tabs = await messenger.tabs.query({ active: true, currentWindow: true });
            let current_message = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);

            // If the Tag is already assigned to the message --> remove it
            if (current_message["tags"].includes(data.key)) {
                let indexForRemoval = current_message["tags"].indexOf(data.key)
                current_message["tags"].splice(indexForRemoval, 1)
                messenger.messages.update(current_message.id, { tags: current_message["tags"] })
            }
            // If the Tag is new --> add it
            else {
                messenger.messages.update(current_message.id, { tags: [...current_message["tags"], data.key] })
            }

        }
            break;
        case "getnotificationdetails":
            {
                // Get the current Tags
                let tabs = await messenger.tabs.query({ active: true, currentWindow: true });
                let current_tags = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);
                current_tags = current_tags["tags"]
                // create the information chunk we want to return to our message content script
                return {
                    current_tags: current_tags,
                    tags: tags
                };
            }
            break;


    }
};

/**
 * handle the received message by filtering for all messages
 * whose "type" property is set to "command".
 */
const handleMessage = (message, sender, sendResponse) => {

    if (message && message.hasOwnProperty("command")) {
        // if we have a command, return a promise from the command handler
        return doHandleCommand(message, sender);
    }
};

/**
 * Add a handler for communication with other parts of the extension,
 * like our messageDisplayScript.
 *
 * 👉 There should be only one handler in the background script
 *    for all incoming messages
 */
browser.runtime.onMessage.addListener(handleMessage);

// When a new message arrieves assign tags
browser.messages.onNewMailReceived.addListener((folder, messageList) => {
    let author = messageList.messages[0].author.toLowerCase()
    if (author.endsWith(">")) {
        author = author.match(".*<(.*)>$")[1]
    }
    messenger.storage.local.get(`email_config`)
        .then((val) => {
            if (author in val['email_config']) {
                messenger.messages.update(messageList.messages[0].id, { tags: val[`email_config`][author] })
            }
        })
});

/**
 * Execute the startup handler whenever Thunderbird starts
 */
document.addEventListener("DOMContentLoaded", handleStartup);