// Function Submit Data
function submitData() {
  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let phone = document.getElementById("phone").value;
  let subject = document.getElementById("subject").value;
  let message = document.getElementById("message").value;

  if (name == "") {
    return alert("Nama wajib di isi");
  } else if (email == "") {
    return alert("Email wajib di isi");
  } else if (phone == "") {
    return alert("Nomor HP wajib di isi");
  } else if (subject == "") {
    return alert("Subject wajib di isi");
  } else if (message == "") {
    return alert("Message wajib di isi");
  }

  let emailReceiver = "alditegar@gmail.com";

  //   Membuat Element anchor
  let a = document.createElement("a");
  a.href = `mailto:${emailReceiver}?subject=${subject}&body=Hello my name ${name}, ${subject}, ${message}`;

  //   Agara tombol anchor diklik
  a.click();
}
