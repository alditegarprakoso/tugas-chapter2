function previewImage() {
  document.getElementById("preview").style.display = "block";
  var oFReader = new FileReader();
  oFReader.readAsDataURL(document.getElementById("image").files[0]);

  oFReader.onload = function (oFREvent) {
    document.getElementById("preview").src = oFREvent.target.result;
    document.getElementById("preview").classList.add("img-thumbnail", "mt-3");
  };
}

function previewImageUpdate() {
  document.getElementById("preview").style.display = "block";
  var oFReader = new FileReader();
  oFReader.readAsDataURL(document.getElementById("image").files[0]);

  oFReader.onload = function (oFREvent) {
    document.getElementById("preview").src = oFREvent.target.result;
  };
}
