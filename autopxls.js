


function AutoPXLS(images, tim, dif){
//

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  images = shuffle(images);

// ===
  
  if (Notification.permission !== "granted")
    Notification.requestPermission();

  var om = App.socket.onmessage;

  App.socket.onmessage = function(message){
    var m = JSON.parse(message.data);

    if(m.type == "captcha_required"){
      if (Notification.permission !== "granted")
        Notification.requestPermission();
      else {
        var notification = new Notification('Notification title', {
          body: "Hey there! Enter the captcha!",
        });
      }
    }

    om(message);
  }
//



  var Painter = function(config){
    var board = document.getElementById("board").getContext('2d');
    var title = config.title || "unnamed";

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = config.image;
    var x = config.x;
    var y = config.y;

    var canvas = document.createElement('canvas');
    var image;

    var image_loaded_flag = false;


    function isSamePixelColor(coords){
      var board_pixel = board.getImageData((parseInt(x) + parseInt(coords["x"])), (parseInt(y) + parseInt(coords["y"])), 1, 1).data;
      var image_pixel = image.getImageData(coords["x"], coords["y"], 1, 1).data;

      if(image_pixel[3] <= 127) return true;

      for(var i = 0; i < 3; i++){
        if(board_pixel[i] != image_pixel[i]) return false;
      }
      return true;
    }

    function getColorId(coords){
      var pixel = image.getImageData(coords["x"], coords["y"], 1, 1).data;
      var colors = [
        [255,255,255],
        [155,173,183],
        [105, 106, 106],
        [0,0,0],
        [215, 123, 186],
        [172, 50, 50],
        [223, 113, 38],
        [102, 57, 49],
        [251, 242, 54],
        [153, 229, 80],
        [106, 190, 48],
        [95, 205, 228],
        [91, 110, 225],
        [48, 96, 130],
        [217, 87, 99],
        [118, 66, 138],
        [34, 32, 52],
        [69, 40, 60],
        [143, 86, 59],
        [217, 160, 102],
        [238, 195, 154],
        [55, 148, 110],
        [75, 105, 47],
        [82, 75, 36],
        [50, 60, 57],
        [63, 63, 116],
        [99, 155, 255],
        [203, 219, 252],
        [132, 126, 135],
        [89, 86, 82],
        [143, 151, 74],
        [138, 111, 48]
      ];

      var color_id = -1;
      var flag = false;
      for(var i = 0; i < colors.length; i++){
        flag = true;
        for(var j = 0; j < 3; j++){
          if(pixel[j] != colors[i][j]){
            flag = false;
            break;
          }
        }
        if(flag){
          color_id = i;
          break;
        }
      }
      return color_id;
    }

    function tryToDraw(){
      for(var _y = 0; _y < canvas.height; _y++){
        for(var _x = 0; _x < canvas.width; _x++){
          var coords = {x: _x, y: _y};

          if(isSamePixelColor(coords)){
            //console.log("same color, skip");
          }
          else{

            var color_id = getColorId(coords);
            if(color_id < 0) continue;

            console.log("drawing " + title + " coords " + " x:" + (parseInt(x) + parseInt(coords["x"])) + " y:" + (parseInt(y) + parseInt(coords["y"])));

            App.switchColor(color_id);
            App.attemptPlace ( (parseInt(x) + parseInt(coords["x"])), (parseInt(y) + parseInt(coords["y"])) );
            return 20;
          }
        }
      }
      console.log(title + " is correct");
      return -1;
    }

    function drawImage(){
      if(image_loaded_flag){
        return tryToDraw();
      }
      return -1;
    }

    function isReady(){
      return image_loaded_flag;
    }

    img.onload = function(){
      canvas.width = img.width;
      canvas.height = img.height;
      image = canvas.getContext('2d');
      image.drawImage(img, 0, 0, img.width, img.height);

      image_loaded_flag = true;
    };



    return {
      drawImage: drawImage,
      isReady: isReady
    }
  };


  var painters = [];
  for(var i = 0; i < images.length; i++){
    painters[i] = Painter(images[i]);
  }

  function draw(){
    var timer = (App.cooldown-(new Date).getTime())/1E3;
    if(0<timer){
      console.log("timer: " + timer);
      setTimeout(draw, tim);
    }
    else{
      for(var i = 0; i < painters.length; i++){
        if(painters[i].isReady()){
          var result = painters[i].drawImage();

          if(result > 0){
            setTimeout(draw, dif);
            return;
          }
          else{
            continue;
          }
        }
        else{
          continue;
        }
      }
      setTimeout(draw, dif);
    }

    return;
  }

  draw();
}
