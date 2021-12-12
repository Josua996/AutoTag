const changebutton = (current_button, color) => {

  // Change the transperency of the Buttons 
  // TODO The way its currently done is kinda dump
  let color_vals = current_button.style.backgroundColor.slice(5, -1).split(",")
  // If active change to unactive
  if (parseFloat(color_vals[3]) > 0.4){
    color_vals[3] = "0.2"
  } else{
    color_vals[3] = "0.8"
  }
  color_vals = `rgba(${color_vals.join(",")})`
  current_button.style.backgroundColor = color_vals
}

const showNotification = async () => {
  var tagbar_activated = false;

  // If the Tagbar is deactivated nothing should be rendered
  await messenger.storage.local.get("tagbar_activated").then((val) => {
    if (val["tagbar_activated"] === true){
      tagbar_activated = true
    }
  })
  if (!tagbar_activated){
    return
  }


  let notificationDetails = await browser.runtime.sendMessage({
    command: "getnotificationdetails",
  });
  // get the details back from the formerly serialized content
  const { current_tags, tags } = notificationDetails;

  // create the notification element itself
  const notification = document.createElement("div");
  notification.className = "thunderbirdMessageDisplayActionExample";

  // create the notificatino text element
  const notificationText = document.createElement("div");
  //notificationText.innerText = current_tags;

  
  // create a button to diplay it in the notification
  tags.forEach(element => {
    let current_button = document.createElement("button");
    current_button.className = "inMessageTags_Button";
    current_button.innerText = `${element.tag}`;
    current_button.id = `${element.tag}`;

    if (current_tags.includes(element.key)) {
      current_button.style.backgroundColor = `${element.color}CC`;
    }else{
      current_button.style.backgroundColor = `${element.color}33`;
    }
    current_button.addEventListener("click", async () => {
      // add the button event handler to send the command to the background script
      browser.runtime.sendMessage({
        command: "change_tag",
        data: element
      });
      changebutton(current_button)
    });
    notification.appendChild(current_button, element.color);
  });

  // add text and button to the notification
  notification.appendChild(notificationText);

  // and insert it as the very first element in the message
  document.body.insertBefore(notification, document.body.firstChild);
};

showNotification();