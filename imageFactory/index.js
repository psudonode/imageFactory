
var img = document.getElementById("target");
var canvas = document.getElementById("canvas");
setImage(document.getElementById("imageSelection").value);

function setPageDefaults() {
	const filename = window.location.pathname.split("/").at(-2);

	document.getElementById("title").innerHTML = filename;
	document.getElementById("titleHeader").innerHTML = filename;
}


/*
This filter will create a pixelation effect on the input image.
It will call the reshape3D() function to get a 3 dimensional array
to allow for easier checking of neighboring pixels within a 
square region to perform manipulations on color values. It will then average
each individual RGB Values and set that RGB Value for the square region.

The region size is currently fixed within the code but will implement user 
input in the future.
*/
function pixelate(imgData) {
	var rawData = imgData;
	var width = rawData.width;
	var height = rawData.height;
	var imgData3D = reshape3D(rawData);
	var imgDataStructure = createDataShell(rawData);
	// Calculate the square size for the generated pixel effect
	var gridSquareSize = 15; // x by x square of pixels
	var avgDiv = gridSquareSize ** 2;
	var gridWidth = Math.floor(width/gridSquareSize); // how many grid square wide
	var gridHeight = Math.floor(height/gridSquareSize); // how many grid squares tall
	var widthTrim = Math.ceil((width - (gridWidth*gridSquareSize))/2);
	var heightTrim = Math.ceil((height - (gridHeight*gridSquareSize))/2);

	for (var y = 0; y < gridHeight; y++) {
		for (var x = 0; x < gridWidth; x++) {
			// Iterate through all values within grid squares and sum the values
			var redChannelSum = 0;
			var greenChannelSum = 0;
			var blueChannelSum = 0;
			for (var yInner = (y*gridSquareSize)+heightTrim; yInner < (((y+1)*gridSquareSize)+heightTrim); yInner++) {
				for (var xInner = (x*gridSquareSize)+widthTrim; xInner < (((x+1)*gridSquareSize)+widthTrim); xInner++) {
					redChannelSum += imgData3D[yInner][xInner][0];
					greenChannelSum += imgData3D[yInner][xInner][1];
					blueChannelSum += imgData3D[yInner][xInner][2];
				}
			}

			// Average the total channel sums and assign the values to every pixel within the grid square
			var redChannelAverage = redChannelSum / avgDiv;
			var greenChannelAverage = greenChannelSum / avgDiv;
			var blueChannelAverage = blueChannelSum / avgDiv;
			for (var yInner = (y*gridSquareSize)+heightTrim; yInner < (((y+1)*gridSquareSize)+heightTrim); yInner++) {
				for (var xInner = (x*gridSquareSize)+widthTrim; xInner < (((x+1)*gridSquareSize)+widthTrim); xInner++) {
					imgData3D[yInner][xInner][0] = redChannelAverage;
					imgData3D[yInner][xInner][1] = greenChannelAverage;
					imgData3D[yInner][xInner][2] = blueChannelAverage;
				}
			}
		}
	}

	var newData = reshape1D(imgData3D, imgDataStructure); 
	return newData;
}


// Convert 1D array imgData to 3D array 
// NOTE:  (((Array[y-position][x-position][channel(Red, Green, Blue, Alpha)])))
function reshape3D(imgData) {
	var width = imgData.width;
	var height = imgData.height;
	var data = imgData.data;
	var converted3DArray = new Array();
	//console.log("hello");
	var imgChannelValuePointer = 0;
	for (var row = 0; row < height; row++) {
		var newRow = [];
		converted3DArray.push(newRow);
		for (var column = 0; column < width; column++) {
			var newColorChannel = [];
			newRow.push(newColorChannel);
			for (var channel = 0; channel < 4; channel++) {
				newColorChannel.push(data[imgChannelValuePointer]);
				imgChannelValuePointer++;
			}
		}
	}
	//console.log(converted3DArray[0][0][0]);
	return converted3DArray;
}

// Convert
function reshape1D(imgData3D, dataShell) {
	var imgData1D = dataShell;
	var width = imgData1D.width;
	var height = imgData1D.height;
	imgData1D.data = new Uint8ClampedArray(4*width*height);
	var i = 0;
	for (var row = 0; row < height; row++) {
		//console.log(i);
		for (var column = 0; column < width; column++) {
			for (var channel = 0; channel < 4; channel++) {
				imgData1D.data[i] = imgData3D[row][column][channel];
				i++;
			}
		}
	}
	return imgData1D;
}

// Maintain the shape/shell of the imgData but clear out all channel data
// This function is to assist the conversion from a 3 dimensional array to
// a 1 dimensional array and back again by creating an ImageData() object 
// to maintain the type/data structure needed by the canvas element.
function createDataShell(imgData) {
	var emptyShell = imgData;
	for (var i = 0; i < emptyShell.data.length; i++) {
		emptyShell.data[i] = 0;
	}
	
	//console.log(emptyShell);
	//console.log(emptyShell.data);

	return emptyShell;
}


// Proof of Concept that a 1 dimensional array can be reshaped into 
// a 3 dimensional array for pixel manipulation and then back into 
// a 1 dimensional array so that the canvas element can display
// the pixel data.
function POC(imgData) {
	var data3D = reshape3D(imgData);
	var emptyShell = createDataShell(imgData);
	return reshape1D(data3D, emptyShell);
}

// Creates a normal gray scale image by averaging the 3 RGB values 
// and replacing each RGB value with the average of the 3.
function grayScale(imgData) {
	var newData = imgData;
	for (var i = 0; i < newData.data.length; i += 4) {
		let newValue = (newData.data[i] + newData.data[i+1] + newData.data[i+2]) / 3;
		newData.data[i] = newValue;
		newData.data[i+1] = newValue;
		newData.data[i+2] = newValue;
	}
	return newData;
}

// Creates a gray scale image using the Root Mean Square formula.
// RMS = SQRT(Mean(of all Values Squared))
// RMS = SQRT(Sigma/SUM(VALUES**2)/Number of Values)
// RMS = Root Mean Square
function grayScaleRMS(imgData) {
	var newData = imgData;
	for (var i = 0; i < newData.data.length; i += 4) {
		let RMS = Math.sqrt((newData.data[i]**2 + newData.data[i+1]**2 + newData.data[i+2]**2) / 3);
		newData.data[i] = RMS;
		newData.data[i+1] = RMS;
		newData.data[i+2] = RMS;
	}
	return newData;
}

// Creates a Red Scale Image by setting BG Values to Zero
function redChannel(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		//newData.data[i] = 0;
		newData.data[i+1] = 0;
		newData.data[i+2] = 0;
		//newData.data[i+3] = 0;
	}
	return newData;
}

// Creates a Green Scale Image by setting RB Values to Zero
function greenChannel(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = 0;
		//newData.data[i+1] = 0;
		newData.data[i+2] = 0;
		//newData.data[i+3] = 0;
	}
	return newData;
}

// Creates a Blue Scale Image by setting RG Values to Zero
function blueChannel(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = 0;
		newData.data[i+1] = 0;
		//newData.data[i+2] = 0;
		//newData.data[i+3] = 0;
	}
	return newData;
}

// Creates an Alpha Scale Image by setting RGB Values to Zero.
// This function can be used to for image composition by creating an
// Alpha Channel Mask to hide/show/obscure pixel of another image based off
// of the alpha channel values from this image.
// Best used with image formats that preserve Alpha Channel characteristics.
function alphaChannel(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = 0;
		newData.data[i+1] = 0;
		newData.data[i+2] = 0;
		//newData.data[i+3] = 0;
	}
	return newData;
}

// This will swap color channel positions from RGB to RBG
function RGB2RBG(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = imgData.data[i];
		newData.data[i+1] = imgData.data[i+2];
		newData.data[i+2] = imgData.data[i+1];
		//newData.data[i+3] = 0;
	}
	return newData;
}

// This will swap color channel positions from RGB to BGR
function RGB2BGR(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = imgData.data[i+2];
		newData.data[i+1] = imgData.data[i+1];
		newData.data[i+2] = imgData.data[i];
		//newData.data[i+3] = 0;
	}
	return newData;
}

// This will swap color channel positions from RGB to BRG
function RGB2BRG(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = imgData.data[i+2];
		newData.data[i+1] = imgData.data[i];
		newData.data[i+2] = imgData.data[i+1];
		//newData.data[i+3] = 0;
	}
	return newData;
}

// This will swap color channel positions from RGB to GRB
function RGB2GRB(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = imgData.data[i+1];
		newData.data[i+1] = imgData.data[i];
		newData.data[i+2] = imgData.data[i+2];
		//newData.data[i+3] = 0;
	}
	return newData;
}

// This will swap color channel positions from RGB to GBR
function RGB2GBR(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = imgData.data[i+1];
		newData.data[i+1] = imgData.data[i+2];
		newData.data[i+2] = imgData.data[i];
		//newData.data[i+3] = 0;
	}
	return newData;
}

// Creats an inverted color image by replacing each color channel value
// with the 8 Bit (0 - 255) compliment. ie. a color value of 234 would yeild
// a compliment value of 21. (255 - 234 = 21)
function invert(imgData) {
	var newData = imgData;
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = 255 - imgData.data[i];
		newData.data[i+1] = 255 - imgData.data[i+1];
		newData.data[i+2] = 255 - imgData.data[i+2];
		//newData.data[i+3] = 0;
	}
	return newData;
}

/* REVISE COMMENTS TO BETTER MATCH ACTUAL ACTIVITIES
	This filter creates a posterized effect on the input image by creating
	"sinking points" for color channel values to "fall" into. This is accomplished
	by "fragmenting" the color channel range. For example, if a value a 4
	is passed in as the fagment value, then the range of 0-255 would be split
	into 8 different sinking points spaced  64 points (255/4() from each other.
	By dividing the input value by the sink valueand then taking the floor function
	(rounding down) and multiplying that by the sink value the input value is
	effectively reduced down to the nearest interval value set by the sink.
	
	Ex.
		fragment = 4
		sink = 256/fragment = 64
		valueIn = 165
		165/64 = 2.58
		floor(2.58) = 2
		2 * sink = 2 * 64 = 128
		valueOut  = 128

	NOTE: The number of possible colors will be the fragment value to the power of 3.
	Ex. 
		fragment = 4
		total number of mixed color values = 4 ** 3 = 64
*/
function posterizeFloor(imgData, fragmentatinon) {
	var newData = imgData;
	var fragment = fragmentatinon;
	var sink = (256/fragment);
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = Math.floor(imgData.data[i]/sink) * sink;
		newData.data[i+1] = Math.floor(imgData.data[i+1]/sink) * sink;
		newData.data[i+2] = Math.floor(imgData.data[i+2]/sink) * sink;
		//newData.data[i+3] = 0;
	}
	return newData;
}

/* REVISE COMMENTS TO BETTER MATCH ACTUAL ACTIVITIES
	This function performs similarly to the posterizeFloor function with one key difference.
	Instead of using the floor funtion the round down it uses the Ciel function to round up.
	This will yeild a similar image but with a brighter apearance.
*/
function posterizeCeil(imgData, fragmentatinon) {
	var newData = imgData;
	var fragment = fragmentatinon;
	var sink = (256/fragment);
	for(var i = 0; i < newData.data.length; i += 4) {
		newData.data[i] = Math.ceil(imgData.data[i]/sink) * sink;
		newData.data[i+1] = Math.ceil(imgData.data[i+1]/sink) * sink;
		newData.data[i+2] = Math.ceil(imgData.data[i+2]/sink) * sink;
		//newData.data[i+3] = 0;
	}
	return newData;
}

function setImage(value) {
	//var img = document.getElementById("target");
	//var canvas = document.getElementById("canvas");
	img.src = "resources/" + value + ".jpg";

	img = document.getElementById("target");
	canvas.setAttribute("width", img.naturalWidth);
	canvas.setAttribute("height", img.naturalHeight);
	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	var imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
	ctx.putImageData(imgData, 0, 0);

	setFilter();
}

function addCanvas(id, img, filter) {
	canvas.setAttribute("id", id);
	canvas.setAttribute("width", img.naturalWidth);
	canvas.setAttribute("height", img.naturalHeight);

	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	var imgData = ctx.getImageData(0,0,canvas.width, canvas.height);

	let newData = filter(imgData);

	ctx.putImageData(newData, 0, 0);
	document.body.appendChild(canvas);
}


function setFilter() {
	let filter = document.getElementById("filterSelection").value;
	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	var imgData = ctx.getImageData(0,0,canvas.width, canvas.height);

	let newdata;
	switch (filter) {
		case "pixelate":
			newData = pixelate(imgData);
			break;
		case "redChannel":
			newData = redChannel(imgData);
			break;
		case "blueChannel":
			newData = blueChannel(imgData);
			break;
		case "greenChannel":
			newData = greenChannel(imgData);
			break;
		case "invert":
			newData = invert(imgData);
			break;
		case "grayScale":
			newData = grayScale(imgData);
			break;
		case "posterizeFloor":
			newData = posterizeFloor(imgData, 3);
			break;
		case "posterizeCeil":
			newData = posterizeCeil(imgData, 3);
			break;
		case "grayScaleRMS":
			newData = grayScaleRMS(imgData);
			break;
	}

	ctx.putImageData(newData, 0, 0);
}

//addCanvas("emptyShell", img, createDataShell);
//addCanvas("Proof of Concept", img, POC);
//addCanvas("Pixel Effect", img, pixelate);
//addCanvas("Red Channel", img, redChannel);
