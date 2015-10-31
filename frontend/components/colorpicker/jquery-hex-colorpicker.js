/*
	Copyright (c) 2014 Boone Putney, booneputney.com
	
	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:
	
	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;(function($){
    $.fn.extend({
        hexColorPicker: function(options) {
            this.defaultOptions = {
                "colorModel":"hsv", //hsv or hsl
                "size":5, //length of picker
                "pickerWidth":200, //width of picker (entire hexagonal area) in pixels
                "container":"none", //contain picker in standard div, or jquery-ui-dialog: "none", "dialog"
                "innerMargin":20, //margin between elements in pixels
                "style":"hex", //block style for individual color options: "hex" or "box"
                "colorizeTarget":true, //colorize background and text of target input: true or false
                "selectCallback":false, //callback after a color were selected
                "submitCallback":false, //callback after a color were submitted
                "outputFormat":"#<hexcode>" //format for target.val(): <hexcode> will be replaced by the 6-character color
            };

            var settings = $.extend({}, this.defaultOptions, options);

            return this.each(function() {
                var $element = $(this);
                settings.blockWidth = Math.floor(settings.pickerWidth/(settings.size*2-1));
                settings.maxBlocks=settings.size*2-1;
                settings.elem = $(this);
                $element.click(function(){
                    $('.hex-color-picker-wrapper').remove();
                    $element.after(formatPicker());
                    stylePicker();
                    settings.targetElem=$element;
                    if(settings.container=="dialog"){
                        $( ".hex-color-picker-wrapper" ).dialog({
                            position: { my: "left top", at: "left bottom", of: $element },
                            resizable: false,
                            title: "Select a Color",
                            height:"auto",
                            width:settings.pickerWidth+settings.innerMargin+settings.blockWidth+40,
                        });
                    }
                });
            });
            
            function fontColor(hexColor){
                var rgb = hexColor.replace("#","").match(/.{1,2}/g);
                var r = parseInt(rgb[0],16)/255;
                var g = parseInt(rgb[1],16)/255;
                var b = parseInt(rgb[2],16)/255;
                var luma = 0.30*r + 0.59*g + 0.11*b;
                return (luma > 0.6) ? '#000000':'#ffffff';	
            }
    			
            function getBlockColor(elem){
                if($(elem).children(".middle").length>0){
                    return $(elem).children(".middle").first().css("background-color");
                }else{
                    return $(elem).css("background-color");
                }
            }   
    			   
            function stylePicker(){
                $('.hex-color-picker-wrapper').css({
        	           "width":(settings.pickerWidth+settings.innerMargin+settings.blockWidth).toString()+"px",
        	       });
        	       $('.hex-color-picker-wrapper .color-block').css({
        	           "width":settings.blockWidth.toString()+"px",
        	           "height":settings.blockWidth.toString()+"px",
        	       });
            	   
        	       $('.hex-color-picker-wrapper .color-picker-container').css({
        	           "width":settings.pickerWidth.toString()+"px",
        	       });
        	       $('.hex-color-picker-wrapper .picker-sidebar').css({
        	           "width":settings.blockWidth.toString()+"px",
        	       });
    					
                $('.hex-color-picker-wrapper .picker-row').css({
                    "height":settings.blockWidth.toString()+"px",
                });
                
                $('.hex-color-picker-wrapper .picker-form-wrapper').css({
            	     "padding-top":settings.innerMargin.toString()+"px",
				    });
    				
				    //display correct sidebar
				    $('.color-picker-container .color-block').click(function(){
    			        $(".picker-sidebar").html(createSidebar(getBlockColor(this)));
			       });
    					
                //set selected color
                $('.hex-color-picker-wrapper .color-block').click(function(){
                    var selectedColor = "#"+rgbToHex(getBlockColor(this));
                    $(".picker-form .selected-color").val(selectedColor);
                    $(".picker-form .selected-color").css({
                        "background-color":selectedColor,
                        "color":fontColor(selectedColor),
                    });
                    if(settings.selectCallback !== false) {
                        settings.selectCallback(selectedColor);
                    }
                    $('.hex-color-picker-wrapper .picker-form').submit();
                });
                
                //set value on submit
                $('.hex-color-picker-wrapper .picker-form').submit(function(e){
                    if($(".picker-form .selected-color").val().length>0){
                        var selectedColor = rgbToHex($(".picker-form .selected-color").val());
                        var selectedColorCSS = "#"+selectedColor;		
                        var selectedColorVal = settings.outputFormat.replace("<hexcode>",selectedColor);			
                        settings.targetElem.val(selectedColorVal);
                        settings.targetElem.change(); //fire change
                        if(settings.colorizeTarget){
                            settings.targetElem.css({
                                "background-color":selectedColorCSS,
                                "color":fontColor(selectedColorCSS),
                            });
                        }
                        if(settings.submitCallback !== false) {
                            settings.submitCallback(selectedColor);
                        }
                    }
                    e.preventDefault();
                    $('.hex-color-picker-wrapper').remove();
                });
                
                //stylize hex blocks
                if(settings.style=="hex"){
                    $('.color-picker-container .color-block').addClass("hex");
                    $('.color-picker-container .color-block').html('<div class="top"></div><div class="middle"></div><div class="bottom"></div>');
                    var middleHeight = Math.ceil(settings.blockWidth/Math.pow(8,1/4));
                    var topHeight = Math.ceil(middleHeight/2);
                    var halfWidth = Math.floor(settings.blockWidth/2);
                    $('.color-picker-container .color-block').each(function(){
                        var blockColor=$(this).css("background-color");
                        $(".picker-row").css({
                            "height":"auto",
                        });
                        $(this).css({
                            "margin-bottom": (-topHeight-1).toString()+"px",
                            "height":"auto",
                        });
                        $(this).children(".top").css({
                            "width": 0,
                            "border-bottom": topHeight.toString()+'px solid '+blockColor,
                            "border-left": halfWidth.toString()+'px solid transparent',
                            "border-right":halfWidth.toString()+'px solid transparent',
                        });
                        $(this).children(".middle").css({
                            "width": settings.blockWidth,
                            "height": middleHeight.toString()+'px',
                            "background": blockColor,
                        });
                        $(this).children(".bottom").css({
                            "width": 0,
                            "border-top": topHeight.toString()+'px solid '+blockColor,
                            "border-left": halfWidth.toString()+'px solid transparent',
                            "border-right":halfWidth.toString()+'px solid transparent',
                        });
                    });
                    $('.color-picker-container .color-block').css("background-color","transparent");
                    $('.hex-color-picker-wrapper .picker-sidebar .color-block').css({
                        "height":(topHeight+middleHeight).toString()+"px",
                    });
                }
            }   
           
            function hexStringTwoDigits(hexString){
                return ("00"+hexString).slice(-2);
            }    
        
            function numericRGBtoString(r,g,b){
                return "#"+hexStringTwoDigits(r.toString(16))+hexStringTwoDigits(g.toString(16))+hexStringTwoDigits(b.toString(16));	
            }
            
            function rgbToHex(rgb) {
                if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb.replace("#",'');
                rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                function hex(x) {
                    return ("0" + parseInt(x).toString(16)).slice(-2);
                }
                return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
            }
            
            function colorizeBlock(normRadius, angle, valueLightness){
                var chroma,X,matchValue;
                var hue=angle%360;//swap 360 with 0;
                var saturation=normRadius;
                var huePrime=hue/60;
                if(settings.colorModel === "hsv"){
                    chroma=valueLightness*saturation;
                    X=chroma*(1-Math.abs(huePrime%2-1));
                    matchValue=valueLightness-chroma;
                }else{
                    chroma=(1-Math.abs(2*valueLightness-1))*saturation;
                    X=chroma*(1-Math.abs(huePrime%2-1));
                    matchValue=(valueLightness-1/2*chroma);
                }
                var r,g,b = 0;
                switch(Math.floor(huePrime)){
                    case 0:
                        r = chroma;
                        g = X;
                        b = 0;
                        break;
                    case 1:
                        r = X;
                        g = chroma;
                        b = 0;
                        break;
                    case 2:
                        r = 0;
                        g = chroma;
                        b = X;
                        break;
                    case 3:
                        r = 0;
                        g = X;
                        b = chroma;
                        break;
                    case 4:
                        r = X;
                        g = 0;
                        b = chroma;
                        break;
                    case 5:
                        r = chroma;
                        g = 0;
                        b = X;
                        break;	
                }
                r = Math.round((r+matchValue)*255);
                g = Math.round((g+matchValue)*255);
                b = Math.round((b+matchValue)*255);
                return numericRGBtoString(r,g,b);
            }
            
            function createSidebar(rgbColor){
                var huePrime;
                var rgb = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                var r = rgb[1]/255;
                var g = rgb[2]/255;
                var b = rgb[3]/255;
                var maxComponent = Math.max.apply(Math,[r,g,b]);
                var minComponent = Math.min.apply(Math,[r,g,b]);
                var chroma=maxComponent-minComponent;
                if(chroma===0){
                    huePrime=0;
                }else if(maxComponent==r){
                    huePrime=((g-b)/chroma+6)%6;		
                }else if(maxComponent==g){
                    huePrime=((b-r)/chroma)+2;		
                }else if(maxComponent==b){
                    huePrime=((r-g)/chroma)+4;
                }
                var hue=huePrime*60;
                var saturation=chroma;
                var valueLightness=1;
                for(var row=0;row<settings.maxBlocks;row++){
                    $('.picker-sidebar .color-block:eq('+row+')').css({
                        'background-color':colorizeBlock(saturation,hue,valueLightness),
                    });		
                    valueLightness-=1/(settings.maxBlocks-1);
                }
            }
            
            function formatPicker(){
                var radius,angle,x,y,valueLightness;
                var output="<div class='hex-color-picker-wrapper'>";
                var centerBlock=Math.floor(settings.maxBlocks/2);
                var maxRadius=Math.sqrt(5/4)*centerBlock;
                output+="<div class='color-picker-container'>";
                for(var row=0;row<settings.maxBlocks;row++){
                    var blocksCount = settings.size+row;
                    if(row>=settings.size){
                        blocksCount = settings.size*2-(row-settings.size+2);	
                    }
                    output+="<div class='picker-row'>";
                    for(var block=0;block<blocksCount;block++){
                        y=centerBlock-row;
                        x=-centerBlock+(block+(settings.maxBlocks-blocksCount)/2);
                        radius=Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
                        var normRadius=radius/maxRadius;
                        angle=Math.atan(y/x)*180/Math.PI+90;
                        if(x>=0){
                            angle+=180;//compensate for right 2 quadrants			
                        }
                        if(settings.colorModel=="hsv"){
                            valueLightness=1;
                        }else{
                            valueLightness=0.5;
                        }
                        if(normRadius===0){angle=0;}//force angle to prevent undefined
                        output+="<div class='color-block' style='background-color:"+colorizeBlock(normRadius,angle,valueLightness)+"'></div>";			
                    }
                    output+="</div>";
                }
                output+="</div>";
                output+='<div class="picker-sidebar">';
                for(row=0;row<settings.maxBlocks;row++){
                    output+="<div class='color-block'></div>";
                }
                output+='</div>';
                output+='<div class="picker-form-wrapper"><form class="picker-form">'+
                    '<input type="text" name="selected-color" class="selected-color" readonly="readonly"/>'+
                    '<input type="submit" value="OK" name="submit" class="submit"/>'+
                    '</form></div>';
                output+="</div>";//end of hex-color-picker-wrapper
                return output;
            }   
        }
    });    
}( jQuery ));
