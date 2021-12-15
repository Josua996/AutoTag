function checkbox_tagbar_changed(e) {
  console.log("Tag activated", e.target.checked)
  messenger.storage.local.set({ tagbar_activated: e.target.checked })
}

function checkbox_fancy_checkboxes_changed(e) {
  console.log("Fancy Checkboxes Toggeled", e.target.checked)
  messenger.storage.local.set({ fancy_checkboxes: e.target.checked })
}

async function init_options_page() {

  // Theme configuration
  let theme = await messenger.theme.getCurrent()
  var r = document.querySelector(':root');

  // Check if a theme is active
  if (theme.colors) {
    // Check if darf theme is active
    // there might be a better solution, but for now it works
    if (theme.colors.popup) {
      let is_dark_theme = parseFloat(theme.colors.popup.split(",")[1]) > 0.5
      if (is_dark_theme) {
        document.getElementsByTagName("body")[0].style.backgroundColor = "#23222B"
      }
    }
    if (theme.colors.popup_text) {
      document.getElementsByTagName("body")[0].style.color = theme.colors.popup_text
      r.style.setProperty('--text-color', theme.colors.popup_text);
    }
  }

  var fancy_checkboxes = false
  // Check if checkboxes should be fancy
  messenger.storage.local.get(`fancy_checkboxes`).then((val) => {
    fancy_checkboxes = !!val.fancy_checkboxes
  })



  // Load and set the strings
  let option_toggle_toolbar = document.getElementById("option_toggle_toolbar")
  option_toggle_toolbar.innerText = browser.i18n.getMessage("option_toggle_toolbar")

  let option_auto_tag_address_headline = document.getElementById("option_auto_tag_address_headline")
  option_auto_tag_address_headline.innerText = browser.i18n.getMessage("option_auto_tag_address_headline")

  let option_toggle_toolbar_label = document.getElementById("option_toggle_toolbar_label")
  option_toggle_toolbar_label.innerText = browser.i18n.getMessage("enabled")

  let checkbox_fancy_checkboxes_label = document.getElementById("checkbox_fancy_checkboxes_label")
  checkbox_fancy_checkboxes_label.innerText = browser.i18n.getMessage("enabled")

  let option_toggle_checkboxes = document.getElementById("option_toggle_checkboxes")
  option_toggle_checkboxes.innerText = browser.i18n.getMessage("option_toggle_checkboxes")

  // Change if the Tag Selection is shown (in message window)
  let checkbox = document.getElementById("checkbox_tagbar");
  // If fancy checkboxes are turned on --> add class
  if (fancy_checkboxes) {
    checkbox.classList.add("fancy_checkbox")
  }
  messenger.storage.local.get("tagbar_activated").then((val) => {
    if (val["tagbar_activated"] === true) {
      checkbox.checked = true
    }
  })


  // Change if the Checkboxes should be fancy
  let fancy_checkbox = document.getElementById("checkbox_fancy_checkboxes");
  messenger.storage.local.get("fancy_checkboxes").then((val) => {
    if (val["fancy_checkboxes"] === true) {
      fancy_checkbox.checked = true
    }
  })

  // Render option to delete Auto-Tagging rules
  let auto_tag_mails_wrapper = document.getElementById("auto_tag_mails_wrapper");

  // Get all awailable Tags
  const tags = await messenger.messages.listTags()

  // Get Mail Adresses
  let email_config = await messenger.storage.local.get("email_config")
  console.log(email_config)

  // Add the List of E-Mail adresses
  Object.keys(email_config["email_config"]).sort().forEach(current_mail_adress => {

    let table_row = document.createElement("tr");


    // Email
    let mail_adress = document.createElement("td");
    mail_adress.innerText = current_mail_adress
    table_row.appendChild(mail_adress)

    // Tag select
    let tag_selection = document.createElement("td");
    tag_selection.classList.add("tag_selection")
    tag_selection.id = "tag_select"

    tags.forEach(element => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "name";
      checkbox.value = element.key;
      checkbox.id = element.key;
      checkbox.classList.add("tag_select_checkbox")
      // If fancy checkboxes are turned on --> add class
      // Currently disables until i find a way to reload settings page after change
      if (fancy_checkboxes) {
        // checkbox.classList.add("fancy_checkbox")
      }

      // Mark active Tags as active
      if (email_config["email_config"][current_mail_adress].includes(element.key)) {
        checkbox.checked = true
      }

      // If a checkbox is changed
      checkbox.addEventListener('change', async function (changed_checkbox) {

        var elements = changed_checkbox.target.parentNode.childNodes;
        var selected_tags = [];
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].type == 'checkbox' && elements[i].checked) {
            selected_tags.push(elements[i].value)
          }
        }
        console.log("Selected Tags", selected_tags)
        let email_config = { [current_mail_adress]: selected_tags }
        let old_data = await messenger.storage.local.get(`email_config`)
        email_config = { ...old_data.email_config, ...email_config }
        messenger.storage.local.set({ email_config })
      });


      var label = document.createElement('label')
      label.htmlFor = element.key;
      label.appendChild(document.createTextNode(element.tag));
      label.style.color = element.color

      tag_selection.appendChild(checkbox)
      tag_selection.appendChild(label);
    });
    table_row.appendChild(tag_selection)

    // Delete
    let td_delete = document.createElement("td");
    td_delete.classList.add("td_delete")

    let delete_button = document.createElement("button");
    delete_button.innerText = browser.i18n.getMessage("delete")
    delete_button.value = current_mail_adress
    delete_button.classList.add("delete_button")

    // If the button is clicked the entry should be removed
    delete_button.addEventListener("click", (button) => {
      delete email_config["email_config"][button.target.value]
      messenger.storage.local.set(email_config)
      table_row = button.target.parentElement.parentElement
      table_row.parentNode.removeChild(table_row)
    })
    td_delete.appendChild(delete_button)
    table_row.appendChild(td_delete)

    auto_tag_mails_wrapper.appendChild(table_row)
  });

}

document.addEventListener('DOMContentLoaded', init_options_page);
document.getElementById("checkbox_tagbar").addEventListener("change", checkbox_tagbar_changed);
document.getElementById("checkbox_fancy_checkboxes").addEventListener("change", checkbox_fancy_checkboxes_changed);