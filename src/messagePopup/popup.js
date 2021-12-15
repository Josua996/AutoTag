async function load() {
  // Load and set the strings
  let auto_tag_popup_headline = document.getElementById("auto_tag_popup_headline")
  auto_tag_popup_headline.innerText = browser.i18n.getMessage("auto_tag_popup_headline")

  let auto_tag_popup_checkbox_headline = document.getElementById("auto_tag_popup_checkbox_headline")
  auto_tag_popup_checkbox_headline.innerText = browser.i18n.getMessage("auto_tag_popup_checkbox_headline")

  // Get the current theme
  let theme = await messenger.theme.getCurrent()
  console.log("Theme Found", theme)
  var r = document.querySelector(':root');

  if (theme.colors && theme.colors.popup) {
    document.getElementsByTagName("body")[0].style.backgroundColor = theme.colors.popup
  }
  if (theme.colors && theme.colors.popup_text) {
    document.getElementsByTagName("body")[0].style.color = theme.colors.popup_text
    r.style.setProperty('--text-color', theme.colors.popup_text);
  } else {
    r.style.setProperty('--text-color', "white");
  }

  // The user clicked our button, get the active tab in the current window using
  // the tabs API.
  let tabs = await messenger.tabs.query({ active: true, currentWindow: true });

  // Get the message currently displayed in the active tab, using the
  // messageDisplay API. Note: This needs the messagesRead permission.
  // The returned message is a MessageHeader object with the most relevant
  // information.
  let message = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);

  // extract the mail-adress
  // "exmaple" <example@example.de> --> example@example.de
  if (message.author.endsWith(">")) {
    message.author = message.author.match(".*<(.*)>$")[1]
  }

  // Mail Adress to lowercase
  message.author = message.author.toLowerCase()

  // Update the HTML fields with the message subject and sender.
  document.getElementById("from").textContent = message.author;

  let tag_select = document.getElementById("tag_select");


  const tags = await messenger.messages.listTags()

  let email_in_prev_configuration = false
  var old_data = null
  messenger.storage.local.get(`email_config`).then((prev_config) => {
    // Check if undefinded to prevent an error if prev config is undefined (first run)
    if (prev_config["email_config"] !== undefined && message.author in prev_config["email_config"]) {
      console.log(`Konfiguration gefunden`, prev_config["email_config"][message.author])
      email_in_prev_configuration = true
      old_data = prev_config
    }
  })

  // Create the checkboxes
  tags.forEach(element => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "name";
    checkbox.value = element.key;
    messenger.storage.local.get(`email_config`).then((val) => {
      // If tag in the previous configuration was found 
      if (email_in_prev_configuration) {
        if (old_data["email_config"][message.author].includes(element.key)) {
          checkbox.checked = true
        }
      }
    })
    checkbox.id = element.key;

    checkbox.addEventListener('change', async function () {
      var elements = document.getElementById("tag_select").elements;
      var selected_tags = [];
      for (var i = 0; i < elements.length; i++) {
        if (elements[i].type == 'checkbox' && elements[i].checked)
          selected_tags.push(elements[i].value)
      }
      console.log("Selected Tags", selected_tags)
      let old_data = await messenger.storage.local.get(`email_config`)
      // If now no Tags are selected anymote --> delete entry
      if (selected_tags.length == 0) {
        console.log("No tags are selected --> delete entry")
        delete old_data["email_config"][message.author]
        var email_config = { ...old_data.email_config }
      } else {
        var email_config = { [message.author]: selected_tags }
        email_config = { ...old_data.email_config, ...email_config }
      }
      messenger.storage.local.set({ email_config })
    });


    var label = document.createElement('label')
    label.htmlFor = element.key;
    label.appendChild(document.createTextNode(element.tag));
    label.style.color = element.color

    tag_select.appendChild(checkbox)
    tag_select.appendChild(label);
  });


  // Request the full message to access its full set of headers.
  let full = await messenger.messages.getFull(message.id);
  console.log(message)
}
document.addEventListener("DOMContentLoaded", load);