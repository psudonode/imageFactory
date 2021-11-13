// filename: index.js
// projectname: imageFactory
// author: pSudoNode
/* Description:
	index.js is a prototype image processing library for web applications. As it currently stands it is a client side library
	that could easily be converted into a server based application depending on project limitations and feasibility.

	Some basic image filters are present doing simple value manipulations on color channel data.

	The HTML5 canvas element is the key platform for this library. The canvas element uses a 1 dimensional array containing all color and 
	alpha channel data like so [red0, green0, blue0, alpha0, red1, green1, blue1, alpha1, ...... ]. Most the basic filters are building blocks
	for the more complex filter effects using the filter stack.

	Eventually this library will be made into a Class or classes to allow for modularity and portability.
*/

class IMFilter {
	#filterStack;
	#img; // Hold img for reference data to transfer to canvases.
	#imgArray;  //  Holds all images that will be preloaded before any computations occur.
	#displayCanvas; // Show scaled image, but otherwise unaltered.
	#filterCanvas;  // Show scaled image, with selected filter/s applied.
	#scaleFactor;  // Used to scale images to a set width while maintaining height/width image ratio.
	#imgData;  // Holds image width and height values, as well as color and alpha channel data and a 1D array[r,g,b,a,r,g,b,a,....].
	#imgDataShell;  // A imgData data structure to maintain type compliance. Values are arbitrary until used to assist in data structure transposing.
	#width;  // Number of pixels wide of the image subjected to processing.
	#height;  // Number of pixels tall of the image subjected to processing.
	#imgHeight;
	#imgWidth;
	#ctxD;  // Context2D object used to get/set pixel values for the canvas element. (displayCanvas CTX)
	#ctxF;  // Context2D object used to get/set pixel values for the canvas element. (filterCanvas CTX)
	#imgData3D;  // A 3D array of pixel data, used to enable calculations based off of neighboring pixels (such as: pixelation, edge detection, convolution).
	#imgData3DRegisterA; // Used as a data container while performing 3D pixel array computations. Necessary to avoid errors arising from array reference passing.
	#imgData3DRegisterB; // Used as a data container while performing 3D pixel array computations. Necessary to avoid errors arising from array reference passing.
	#filterSelectionMenu = [  // A list of values used to create a "select" element populated with filter options that the user can select.
		["filterSelection", "", 0],
		["grayScale", "Gray Scale", 0],
		["grayScaleRMS", "Gray Scale RMS", 0],
		["redChannel", "Red Scale", 0],
		["greenChannel", "Green Scale", 0],
		["blueChannel", "Blue Scale", 0],
		["alphaChannel", "Alpha Scale", 0],
		["pixelate", "Pixelate", 0],
		["invert", "Invert", 0],
		["posterizeFloor", "Posterize Dark", 0],
		["posterizeCeil", "Posterize Bright", 0],
		["blur", "Blur", 0],
		["bigBlur", "Big Blur", 0],
		["sharpen", "Sharpen", 0],
		["edgeDetect", "Edge Detection", 0]
	];
	#imageSelectionMenu = [  //  A list of local image file names used to allow user selection to demonstrate filter effects on a range of color pallets and textures.
		["imageSelection", "", 0, 0],
		["resources\\facepaint.jpg", "Face Paint", 0, 0],
		["resources\\babygroot.jpg", "Baby Groot", 0, 0],
		["resources\\yellowflowers.jpg", "Yellow Flowers", 0, 0],
		["resources\\cyborg.jpg", "Cyborg", 0, 0]
	];
	#imageList = [
		"list", 
		"resources\\facepaint.jpg",
		"resources\\babygroot.jpg",
		"resources\\yellowflowers.jpg",
		"resources\\cyborg.jpg"
	];
	bigBlurKernel = [  // A strong blur kernel. Use this kernel one time in stead of multiple small blurring convolutions. Computationally more efficient.
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
		[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
		[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
		[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 12, 11, 10, 9, 8, 7, 6, 5 ,4],
		[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
		[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
		[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
		[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
		[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9], 
		[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
		[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9], 
		[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
		[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
		[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
		[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
		[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 12, 11, 10, 9, 8, 7, 6, 5 ,4],
		[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
		[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
	];
	swirlKernel = [  // EXPERIMENTAL...
		[9,8,7,6,0,0,0,0,9],
		[0,0,0,5,4,0,0,0,8],
		[0,0,0,0,3,2,0,0,7],
		[0,0,2,1,0,1,0,5,6],
		[0,4,3,0,9,0,3,4,0],
		[6,5,0,1,0,1,2,0,0],
		[7,0,0,2,3,0,0,0,0],
		[8,0,0,0,4,5,0,0,0],
		[9,0,0,0,0,6,7,8,9]
	];
	boxKernel = [  // EXPERIMENTAL....
		[9,9,9,9,9,9,9,9,9],
		[9,0,0,5,4,5,0,0,9],
		[9,0,0,2,3,2,0,0,9],
		[9,5,2,1,0,1,2,5,9],
		[9,4,3,0,9,0,3,4,9],
		[9,5,2,1,0,1,2,5,9],
		[9,0,0,2,3,2,0,0,9],
		[9,0,0,5,4,5,0,0,9],
		[9,9,9,9,9,9,9,9,9]
	];
	crossKernel = [ // Kernel that pulls heavily weighted values from pixels that are diagonal to the current pixel.
		[1119,0,0,0,0,0,0,0,1119],
		[0,1119,0,0,0,0,0,1119,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0],
		[0,1119,0,0,0,0,0,1119,0],
		[1119,0,0,0,0,0,0,0,1119]
	];
	verticalEdgeDetectKernel = [  // Kernel used for vertical edge detection.
		[-1,0,1],
		[-2,0,2],
		[-1,0,1]
	];
	horizontalEdgeDetectKernel = [  // Kernel used for horizontal edge detection.
		[-1,-2,-1],
		[0,0,0],
		[1,2,1]
	];
	screenPixelPictureKernel = [  //  EXPERIMENTAL....
		[-2,2,2],
		[-3,4,3],
		[-2,-2,2]
	];  
	clownSmearKernel = [  // EXPERIMENTAL...  When used on a color image a smeared clown makeup effect is present.
		[1,0,1],
		[-1,0,1],
		[-1,0,1]
	];  
	fingerPrintKernel = [  // Kernel that creates a grooved pattern on top of the image that resembles the texture of a finger print.
		[-1,0,1],
		[1,0,1],
		[-1,0,1]
	];  
	sharpenKernel = [  // Convolution kernel used to enhance pixel intensity (gray scale) and color values.
		[-1, -2, -1],
		[-2, 19, -2], 
		[-1, -2, -1]
	];  
	blurKernel = [  // Basic blur kernel used in convolution algorithm.
		[.0625,.125,.0625],
		[.125,.25,.125],
		[.0625,.125,.0625]
	];  

	constructor() {
		this.#preload();
		this.#buildMenu("filterList", this.#filterSelectionMenu);
		this.#buildMenu("imageList", this.#imageSelectionMenu);
		this.#displayCanvas = document.getElementById("displayCanvas");
		this.#filterCanvas = document.getElementById("filterCanvas");
		this.#ctxD = this.#displayCanvas.getContext("2d");
		this.#ctxF = this.#filterCanvas.getContext("2d");
		this.update();
		this.#create3D();
		this.#copyImgData3D(this.#imgData3D, this.#imgData3DRegisterA);
		this.#copyImgData3D(this.#imgData3DRegisterA, this.#imgData3DRegisterB);
		this.#createDataShell();
		//setTimeout(this.update(), 2000);
	}



	/*  REWORK
		Used to load images before app can be used to have faster image switching and avoid errors arising from 
		trying to reference attribute values before they are stored in memory.
	*/
	#preload() {
		this.#imgArray = new Array();
		var loadingImage;
		for (var i = 1; i < this.#imageList.length; i++) {
			loadingImage = new Image();
			loadingImage.src = this.#imageList[i];
			this.#imgArray[i] = loadingImage;
			this.#imageSelectionMenu[i][2] = this.#imgArray[i].height;
			console.log(this.#imgArray[i].height);
			this.#imageSelectionMenu[i][3] = this.#imgArray[i].width;
			this.#img = this.#imgArray[i];
			console.log(this.#imgArray[i].height, this.#imgArray[i].width);
			if (this.#imgArray[i].height == 0 || this.#imgArray[i].width == 0) {
				
			}
		}
	}

	#buildMenu(target, menuList) {
		//console.log(target, "buildMenu(): STARTING....");
		let targetDiv = document.getElementById(target);
		let selectBox = document.createElement("select");
		selectBox.id = menuList[0][0];
		for (var i = 1; i < menuList.length; i++) {
			var selectOption = document.createElement("option");
			selectOption.value = menuList[i][0];
			selectOption.innerHTML = menuList[i][1];
			selectBox.appendChild(selectOption);
		}
		selectBox.setAttribute("onchange", "filter.update()");
		targetDiv.appendChild(selectBox);
	}

	/* Updates displayed image and filter effect based on user input. 
		******
	*/
	update() {
		// this.splashScreen();
		this.#setImage();
		this.#scaleImage();
		this.#setCanvasImage();
		this.#setFilter();
		this.#ctxF.putImageData(this.#imgData, 0, 0);
	}

	splashScreen() {
		this.update();
		var div = document.getElementById("welcome");
		//div.setAttribute("style", "zIndex: -1; opacity: 0.0;")
		div.style.zIndex = "-1";
		div.style.opacity = "0.0";
		// var slides = document.querySelector(".slide");
		// for (var i = 0; i < slides.length; i++) {
		// 	slides[i].style.opacity = "0.0";
		// 	slides[i].style.color = "black";
		// } 
	}


	/* Sets image from predetermined list.
		Does not allow for user owned images to be set. YET....
		Sets image variable for data reference for display and filter canvases. If image is too large to be displayed on screen at 
		native resolution image scaling will be necessary to prevent any unintentional cropping.
	*/
	#setImage() {
		var value = document.getElementById("imageSelection").value;
		var index = this.#imageList.indexOf(value);
		this.#img = this.#imgArray[index];
		console.log(this.#img);
	}

	/*  Scale images to 40% of screen width while maintaining the image ratio.
		The purpose of this function is to scale an Image before it is displayed on the screen so that there is not any 
		unintentional cropping. 
	*/
	#scaleImage() {
		var pixelsWide = document.querySelector(".display").clientWidth;
		var value = document.getElementById("imageSelection").value;
		var selectedImageIndex = this.#imageList.indexOf(value);

		this.#scaleFactor = pixelsWide / this.#img.naturalWidth;
		this.#img.width = pixelsWide;
		this.#img.height = this.#imageSelectionMenu[selectedImageIndex][2] * this.#scaleFactor;

		this.#displayCanvas.setAttribute("width", this.#img.width);
		this.#displayCanvas.setAttribute("height", this.#img.height);
		this.#filterCanvas.setAttribute("width", this.#img.width);
		this.#filterCanvas.setAttribute("height", this.#img.height);
		
		this.#ctxD.scale(this.#scaleFactor, this.#scaleFactor);
		this.#ctxF.scale(this.#scaleFactor, this.#scaleFactor);

		this.#width = this.#filterCanvas.width;
		this.#height = this.#filterCanvas.height;
	}

	/*   Sets the image data to each of the canvases   */
	#setCanvasImage() {
		this.#ctxD.drawImage(this.#img, 0, 0);
		this.#ctxF.drawImage(this.#img, 0, 0);
		this.#imgData = this.#ctxD.getImageData(0,0,this.#width, this.#height);
		this.#ctxF.putImageData(this.#imgData, 0, 0);
	}

	/* Sets filter based off of user selection.
		This function will be called by the update function which in turn will be called when the user changes a selction value 
		on the page controls section. It will get the filter selection value from the filterSelction element and then make the necessary 
		filter function calls to achieve the desired effect.
	*/
	#setFilter() {
		let filter = document.getElementById("filterSelection").value;
		let newdata;
		switch (filter) {
			case "pixelate":
				this.#pixelate();
				break;
			case "redChannel":
				this.#redChannel();
				break;
			case "blueChannel":
				this.#blueChannel();
				break;
			case "greenChannel":
				this.#greenChannel();
				break;
			case "invert":
				this.#invert();
				break;
			case "grayScale":
				this.#grayScale();
				break;
			case "posterizeFloor":
				this.#posterizeFloor();
				break;
			case "posterizeCeil":
				this.#posterizeCeil();
				break;
			case "grayScaleRMS":
				this.#grayScaleRMS();
				break;
			case "blur":
				this.#blur();
				this.#convolve(this.blurKernel);
				break;
			case "bigBlur":
				this.#convolve(this.bigBlurKernel);
				break;
			case "swirlBlur":
				this.#convolve(this.swirlKernel);
				break;	
			case "boxBlur":
				this.#convolve(this.boxKernel);
				break;	
			case "jackBlur":
				this.#convolve(this.crossKernel);
				this.#posterizeFloor();
				break;	
			case "bigEdge":
				this.#grayScale();
				this.#convolve(this.bigEdgeKernel);
				break;
			case "edgeDetect":
				this.#grayScaleRMS();
				this.#convolve(this.bigBlurKernel);
				this.#convolve(this.horizontalEdgeDetectKernel);
				// this.#copyImgData3D(this.#imgData3D, this.#imgData3DRegisterB);

				// this.#setCanvasImage();

				// this.#grayScaleRMS();
				// this.#convolve(this.bigBlurKernel);
				// this.#convolve(this.verticalEdgeDetectKernel);
				// this.#copyImgData3D(this.#imgData3D, this.#imgData3DRegisterA);

				// this.#vectorSum(this.#imgData3DRegisterA, this.#imgData3DRegisterB);
				break;
			case "sharpen":
				this.#convolve(this.sharpenKernel);
				break;
			case "grayPoster":
				this.#grayScaleRMS();
				this.#posterizeFloor();
				break;
			case "redPoster":
				this.#redChannel();
				this.#posterizeFloor();
				break;
			case "grayPixel":
				this.#grayScaleRMS();
				this.#pixelate();
				break;
		}
	}

	/*  This filter will create a pixelation effect on the input image.
		It will call the reshape3D() function to get a 3 dimensional array
		to allow for easier checking of neighboring pixels within a 
		square region to perform manipulations on color values. It will then average
		each individual RGB Values and set that RGB Value for the square region.

		The region size is currently fixed within the code but will implement user 
		input in the future.
	*/
	#pixelate() {
		this.#reshape3D();
		const gridSquareSize = document.getElementById("parameter").value; // x by x square of pixels
		const avgDiv = gridSquareSize ** 2;
		const gridWidth = Math.floor(this.#width/gridSquareSize); // how many grid square wide
		const gridHeight = Math.floor(this.#height/gridSquareSize); // how many grid squares tall
		const widthTrim = Math.ceil((this.#width - (gridWidth*gridSquareSize))/2);
		const heightTrim = Math.ceil((this.#height - (gridHeight*gridSquareSize))/2);

		for (var y = 0; y < gridHeight; y++) {
			for (var x = 0; x < gridWidth; x++) {
				// Iterate through all values within grid squares and sum the values
				var redChannelSum = 0;
				var greenChannelSum = 0;
				var blueChannelSum = 0;
				for (var yInner = (y*gridSquareSize)+heightTrim; yInner < (((y+1)*gridSquareSize)+heightTrim); yInner++) {
					for (var xInner = (x*gridSquareSize)+widthTrim; xInner < (((x+1)*gridSquareSize)+widthTrim); xInner++) {
						redChannelSum += this.#imgData3D[yInner][xInner][0];
						greenChannelSum += this.#imgData3D[yInner][xInner][1];
						blueChannelSum += this.#imgData3D[yInner][xInner][2];
					}
				}

				// Average the total channel sums and assign the values to every pixel within the grid square
				var redChannelAverage = redChannelSum / avgDiv;
				var greenChannelAverage = greenChannelSum / avgDiv;
				var blueChannelAverage = blueChannelSum / avgDiv;
				for (var yInner = (y*gridSquareSize)+heightTrim; yInner < (((y+1)*gridSquareSize)+heightTrim); yInner++) {
					for (var xInner = (x*gridSquareSize)+widthTrim; xInner < (((x+1)*gridSquareSize)+widthTrim); xInner++) {
						this.#imgData3D[yInner][xInner][0] = redChannelAverage;
						this.#imgData3D[yInner][xInner][1] = greenChannelAverage;
						this.#imgData3D[yInner][xInner][2] = blueChannelAverage;
					}
				}
			}
		} 
		this.#reshape1D();
	}

	/* DEPRICATED. Use "this.#convolve(kernelInput)".
		Basic Blur Filter
		This Filter uses the convolution method and a built in weighted kernel to achieve a blurring affect. 
		This method is ineffective and was developed more as a proof of concept. After futher research it has been determined that 
		in order to have a blur effect with greater intensity a kernel with a larger distribution radius would be more cost effective then 
		running this algorithm repeatedly. This function will be kept as a point of reference for algorithm efficiency as well as for 
		library legacy data.
	*/
	#blur() {
		this.#reshape3D();
		var blurData3D = this.#imgData3D;
		var kernel = [
						[.0625,.125,.0625],
						[.125,.25,.125],
						[.0625,.125,.0625]
					 ];
		for (var row = 1; row < this.#height-1; row++) {
			for (var column = 1; column < this.#width-1; column++) {
				for (var channel = 0; channel < 3; channel++) {
					var blurredChannel = Math.floor((
											(this.#imgData3D[row-1][column-1][channel] * kernel[0][0]) +
											(this.#imgData3D[row-1][column][channel] * kernel[0][1]) +
											(this.#imgData3D[row-1][column+1][channel] * kernel[0][2]) +
											(this.#imgData3D[row][column-1][channel] * kernel[1][0]) +
											(this.#imgData3D[row][column][channel] * kernel[1][1]) +
											(this.#imgData3D[row][column+1][channel] * kernel[1][2]) +
											(this.#imgData3D[row+1][column-1][channel] * kernel[2][0]) +
											(this.#imgData3D[row+1][column][channel] * kernel[2][1]) +
											(this.#imgData3D[row+1][column+1][channel] * kernel[2][2])
										));
					blurData3D[row][column][channel] = blurredChannel;
				}
			}
		}
		this.#imgData3D = blurData3D;
		this.#reshape1D();
	}

	/*	Convolution will take a kernel/mask and apply a moving average and assign the result to the center pixel of the output 
		data structure. As of now this convolution function does not handle kernels that need to be rotated like more advanced 
		edge detection kernels. This is also a single pass algorithm. If more than one pass is needed, call this function 
		recursively to achieve desired results.
	*/
	#convolve(kernelInput) {
		this.#reshape3D();
		var convolveData3D = this.#imgData3DRegisterA;
		const kernel = kernelInput;
		const kRow = kernel.length;

		const kColumn = kernel[0].length;
		const kRowRadius = Math.floor(kRow/2)
		const kColumnRadius = Math.floor(kColumn/2);
		var kernelSum = 0;
		for (var yPosition = 0; yPosition < kRow; yPosition++) {
			for (var xPosition = 0; xPosition < kColumn; xPosition++) {
				kernelSum += kernel[yPosition][xPosition];
			}
		}
		if (kRow % 2 == 0 || kColumn % 2 == 0) {
		} else {
			if (kernelSum == 0) {
				for (var row = kRowRadius; row < this.#height - kRowRadius; row++) { // change after padding has been accounted for
					for (var column = kColumnRadius; column < this.#width-kColumnRadius; column++) {  // change after padding has been accounted for
						for (var channel = 0; channel < 3; channel++) {
							var convolvedChannel = 0
							// console.log(convolvedChannel);
							for (var yPosition = 0; yPosition < kRow; yPosition++) {
								for (var xPosition = 0; xPosition < kColumn; xPosition++) {
									convolvedChannel += this.#imgData3D[row - kRowRadius + yPosition][column - kColumnRadius + xPosition][channel] * kernel[yPosition][xPosition];
								}
							}
							convolvedChannel = Math.sqrt(convolvedChannel ** 2);
							convolveData3D[row][column][channel] = convolvedChannel;
						}
					}
				}
			} else {
				console.log(kernelSum);
				for (var row = kRowRadius; row < this.#height-kRowRadius; row++) { // change after padding has been accounted for
					for (var column = kColumnRadius; column < this.#width-kColumnRadius; column++) {  // change after padding has been accounted for
						for (var channel = 0; channel < 3; channel++) {
							var convolvedChannel = 0
							for (var yPosition = 0; yPosition < kRow; yPosition++) {
								for (var xPosition = 0; xPosition < kColumn; xPosition++) {
									convolvedChannel += this.#imgData3D[row - kRowRadius + yPosition][column - kColumnRadius + xPosition][channel] * kernel[yPosition][xPosition];
								}
							}
							if (convolvedChannel < 0) {
								convolvedChannel = Math.sqrt(convolvedChannel ** 2);
							}
							//console.log(convolvedChannel);
							convolveData3D[row][column][channel] = convolvedChannel / kernelSum;///////////////////////////////////////
						}
					}
				}
			}
			this.#imgData3D = convolveData3D;
			this.#reshape1D();
		}
	}

	/*  Calculate Vector Sums for egde detection vertical and horizonal values
		Use the pythagorian formula c = SQRT(a**2 + b**2) to calculate real values.
	*/
	#vectorSum(verticalEdgeVector3DArray, horizontalEdgeVector3DArray) {
		var a;
		var b;
		var c;

		for (var row = 0; row < this.#height; row++) { // change after padding has been accounted for
			for (var column = 0; column < this.#width; column++) {  // change after padding has been accounted for
				for (var channel = 0; channel < 3; channel++) {
					a = horizontalEdgeVector3DArray[row][column][channel];
					b = verticalEdgeVector3DArray[row][column][channel];
					c = Math.sqrt(a**2 + b**2);
					this.#imgData3D[row][column][channel] = c;
				}
			}
		}
		this.#reshape1D();
	}

	/* Copy 3D Array data from Source array to Target array */
	#copyImgData3D(source, target) {
		for (var row = 0; row < this.#height; row++) { // change after padding has been accounted for
			for (var column = 0; column < this.#width; column++) {  // change after padding has been accounted for
				for (var channel = 0; channel < 3; channel++) {
					// console.log(source[row][column][channel]);
					// console.log(target[row][column][channel]);
					target[row][column][channel] = source[row][column][channel];  ////////////////////////////////////////////
				}
			}
		}
	}

	/*	Convert 1D array this.#imgData to 3D array 
		NOTE:  (((Array[y-position][x-position][channel(Red, Green, Blue, Alpha)])))
		Creates this.#imgData3D and this.#imgData3DHelper.
	*/
	#reshape3D() {		
		var data = this.#imgData.data;
		var converted3DArray = new Array();
		// var converted3DArray2 = new Array();
		// var converted3DArray3 = new Array();
		var imgChannelValuePointer = 0;
		for (var row = 0; row < this.#height; row++) {
			var newRow = [];
			// var newRow2 = [];
			// var newRow3 = [];
			converted3DArray.push(newRow);
			// converted3DArray2.push(newRow2);
			// converted3DArray3.push(newRow3);
			for (var column = 0; column < this.#width; column++) {
				var newColorChannel = [];
				// var newColorChannel2 = [];
				// var newColorChannel3 = [];
				newRow.push(newColorChannel);
				// newRow2.push(newColorChannel2);
				// newRow3.push(newColorChannel3);
				for (var channel = 0; channel < 4; channel++) {
					newColorChannel.push(data[imgChannelValuePointer]);
					//newColorChannel2.push(data[imgChannelValuePointer]);
					imgChannelValuePointer++;
				}
			}
		}
		this.#imgData3D = converted3DArray;
	}

	#create3D() {		
		var data = this.#imgData.data;
		var converted3DArray = new Array();
		var converted3DArray2 = new Array();
		var converted3DArray3 = new Array();
		var imgChannelValuePointer = 0;
		for (var row = 0; row < this.#height; row++) {
			var newRow = [];
			var newRow2 = [];
			var newRow3 = [];
			converted3DArray.push(newRow);
			converted3DArray2.push(newRow2);
			converted3DArray3.push(newRow3);
			for (var column = 0; column < this.#width; column++) {
				var newColorChannel = [];
				var newColorChannel2 = [];
				var newColorChannel3 = [];
				newRow.push(newColorChannel);
				newRow2.push(newColorChannel2);
				newRow3.push(newColorChannel3);
				for (var channel = 0; channel < 4; channel++) {
					newColorChannel.push(data[imgChannelValuePointer]);
					newColorChannel2.push(data[imgChannelValuePointer]);
					newColorChannel3.push(data[imgChannelValuePointer]);
					imgChannelValuePointer++;
				}
			}
		}
		this.#imgData3D = converted3DArray;
		this.#imgData3DRegisterA = converted3DArray2;
		this.#imgData3DRegisterB = converted3DArray3;
	}

	// Convert
	#reshape1D() {
		var i = 0;
		for (var row = 0; row < this.#height; row++) {
			for (var column = 0; column < this.#width; column++) {
				for (var channel = 0; channel < 4; channel++) {
					this.#imgData.data[i] = this.#imgData3D[row][column][channel];
					i++;
				}
			}
		}
	}

	/*  Maintain the shape/shell of the this.imgData but clear out all channel data
		This function is to assist the conversion from a 3 dimensional array to
		a 1 dimensional array and back again by creating an ImageData() object 
		to maintain the type/data structure needed by the canvas element.
	*/
	#createDataShell() {
		var emptyShell = this.#imgData;
		for (var i = 0; i < emptyShell.data.length; i++) {
			emptyShell.data[i] = 0;
		}
		this.#imgDataShell = emptyShell;
		return emptyShell;
	}

	// Creates a normal gray scale image by averaging the 3 RGB values.
	#grayScale() {
		var newData = this.#imgData;
		for (var i = 0; i < newData.data.length; i += 4) {
			let newValue = (newData.data[i] + newData.data[i+1] + newData.data[i+2]) / 3;
			newData.data[i] = newValue;
			newData.data[i+1] = newValue;
			newData.data[i+2] = newValue;
		}
		this.#imgData = newData;
	}

	// Creates a gray scale image using the Root Mean Square(RMS) formula.
	#grayScaleRMS() {
		var newData = this.#imgData;
		for (var i = 0; i < newData.data.length; i += 4) {
			let RMS = Math.sqrt((newData.data[i]**2 + newData.data[i+1]**2 + newData.data[i+2]**2) / 3);
			newData.data[i] = RMS;
			newData.data[i+1] = RMS;
			newData.data[i+2] = RMS;
		}
		this.#imgData = newData;
	}

	// Creates a Red Scale Image by setting BG Values to Zero
	#redChannel() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i+1] = 0;
			newData.data[i+2] = 0;
		}
		this.#imgData = newData;
	}

	// Creates a Green Scale Image by setting RB Values to Zero
	#greenChannel() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = 0;
			newData.data[i+2] = 0;
		}
		this.#imgData = newData;
	}

	// Creates a Blue Scale Image by setting RG Values to Zero
	#blueChannel() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = 0;
			newData.data[i+1] = 0;
		}
		this.#imgData = newData;
	}

	/* Creates an Alpha Scale Image by setting RGB Values to Zero.
		This function can be used to for image composition by creating an
		Alpha Channel Mask to hide/show/obscure pixel of another image based off
		of the alpha channel values from this image.
		Best used with image formats that preserve Alpha Channel characteristics.
	*/
	#alphaChannel() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = 0;
			newData.data[i+1] = 0;
			newData.data[i+2] = 0;
		}
		this.#imgData = newData;
	}

	// This will swap color channel positions from RGB to RBG
	#RGB2RBG() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = this.#imgData.data[i];
			newData.data[i+1] = this.#imgData.data[i+2];
			newData.data[i+2] = this.#imgData.data[i+1];
		}
		this.#imgData = newData;
	}

	// This will swap color channel positions from RGB to BGR
	#RGB2BGR() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = this.#imgData.data[i+2];
			newData.data[i+1] = this.#imgData.data[i+1];
			newData.data[i+2] = this.#imgData.data[i];
		}
		this.#imgData = newData;
	}

	// This will swap color channel positions from RGB to BRG
	#RGB2BRG() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = this.#imgData.data[i+2];
			newData.data[i+1] = this.#imgData.data[i];
			newData.data[i+2] = this.#imgData.data[i+1];
		}
		this.#imgData = newData;
	}

	// This will swap color channel positions from RGB to GRB
	#RGB2GRB() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = this.#imgData.data[i+1];
			newData.data[i+1] = this.#imgData.data[i];
			newData.data[i+2] = this.#imgData.data[i+2];
		}
		this.#imgData = newData;
	}

	// This will swap color channel positions from RGB to GBR
	#RGB2GBR() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = this.#imgData.data[i+1];
			newData.data[i+1] = this.#imgData.data[i+2];
			newData.data[i+2] = this.#imgData.data[i];
		}
		this.#imgData = newData;
	}

	/* 	Creates an inverted color image by replacing each color channel value
		with the 8 Bit (0 - 255) compliment. ie. a color value of 234 would yield
		a compliment value of 21. (255 - 234 = 21)
	*/
	#invert() {
		var newData = this.#imgData;
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = 255 - this.#imgData.data[i];
			newData.data[i+1] = 255 - this.#imgData.data[i+1];
			newData.data[i+2] = 255 - this.#imgData.data[i+2];
		}
		this.#imgData = newData;
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
	#posterizeFloor() {
		var newData = this.#imgData;
		var fragment = document.getElementById("parameter").value;
		var sink = (256/fragment);
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = Math.floor(this.#imgData.data[i]/sink) * sink;
			newData.data[i+1] = Math.floor(this.#imgData.data[i+1]/sink) * sink;
			newData.data[i+2] = Math.floor(this.#imgData.data[i+2]/sink) * sink;
		}
		this.#imgData = newData;
	}

	/* REVISE COMMENTS TO BETTER MATCH ACTUAL ACTIVITIES
		This function performs similarly to the posterizeFloor function with one key difference.
		Instead of using the floor funtion the round down it uses the Ciel function to round up.
		This will yeild a similar image but with a brighter apearance.
	*/
	#posterizeCeil() {
		var newData = this.#imgData;
		var fragment = document.getElementById("parameter").value;
		var sink = (256/fragment);
		for(var i = 0; i < newData.data.length; i += 4) {
			newData.data[i] = Math.ceil(this.#imgData.data[i]/sink) * sink;
			newData.data[i+1] = Math.ceil(this.#imgData.data[i+1]/sink) * sink;
			newData.data[i+2] = Math.ceil(this.#imgData.data[i+2]/sink) * sink;
		}
		this.#imgData = newData;
	}

	/* Accepts image data and a stack of filters to be performed on the image.
		Will make calls to filter functions in order of index (0, 1, 2, ...).
		This function allows for multiple filters to be performed sucesively on a given image to achieve 
		results that would be to complicated and inefficient to perform otherwise.
	*/
	#runFilterStack() {
		for (var i = 0; i < this.#filterStack.length; i++) {
			this.#filterStack[i]();
		}
	}
}

// This method will eventually be a part of a pSudoNode project library to set defaults to all project pages and 
// allow for uniformity and design language to be established.
function setPageDefaults() {  // LOW PRIORITY
	const filename = window.location.pathname.split("/").at(-2);
	document.getElementById("title").innerHTML = filename;
	document.getElementById("titleHeader").innerHTML = filename;
}

// function splashScreen() {
// 	// filter.update();
// 	var div = document.getElementById("welcome");
// 	div.style.zIndex = "-1";
// 	div.style.opacity = "0.0";
// 	// var slides = document.querySelector(".slide");
// 	// for (var i = 0; i < slides.length; i++) {
// 	// 	slides[i].style.opacity = "0.0";
// 	// 	slides[i].style.color = "black";
// 	// } 
// }



var filter = new IMFilter();
filter.update();
