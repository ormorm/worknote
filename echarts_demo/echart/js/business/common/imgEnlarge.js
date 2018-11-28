var imgHeight = 0;
var imgWidth = 0;

function viewInfoImg(imgPath) {
	//console.log(imgPath);
	imgHeight = 0;
	imgWidth = 0;
	$("#viewImg").attr("src", imgPath);
	getImageWidth(imgPath,function(w,h){
		imgHeight = h;
    	imgWidth = w;

        //console.log(imgWidth,imgHeight);

        if(imgWidth >0 && imgHeight > 0){
            var iframeWidth = $(window).width();
            var iframeHeight = $(window).height();

            //console.log(iframeWidth,iframeHeight);

            var imgTop = 0;
            if(imgWidth > imgHeight){
                imgTop = 60;
                if(imgWidth > iframeWidth-50){
                    imgWidth = iframeWidth*0.9;
                } else {
                    imgWidth = iframeWidth*0.8;
                }
                if(imgHeight > 850){
                    imgHeight = iframeHeight*0.9;
                } else {
                    imgHeight = iframeHeight*0.8;
                }

                //console.log(1,imgWidth,imgHeight);
            }else{
                imgTop = 30;
                if(imgHeight > iframeHeight-50){
                    imgHeight =  iframeHeight*0.9;
                } else {
                    imgHeight =  iframeHeight*0.8;
                }
                // imgWidth = '600';
                if(imgWidth > 850){
                    imgWidth = iframeWidth*0.45;
                } else {
                    imgWidth = iframeWidth*0.4;
                }
                //console.log(2,imgWidth,imgHeight);
            }

            layer.open({
                type : 1,
                title : false,
                closeBtn : 1,
                skin: 'yourclass',
                area : [ imgWidth +"px", imgHeight+"px" ],
                // skin : 'layui-layer-nobg', //没有背景色
                shadeClose : true,
                scrollbar : false,
                content : $("#imgDiv")
            });
            // 去掉蒙版层
            $(".layui-layer-shade").css("display","none");
            // 给蒙版层添加5像素灰边较为醒目
            $(".layui-layer-content").css({
                "overflow": "hidden",
                "border": "5px solid #d1d1d1",
                // "height":imgHeight,
            })
            imgTop += "px";
            //console.log(imgTop);
            $(".layui-layer.layui-layer-page.layer-anim").css("top",imgTop);
            $("#imgDiv").css({ "width": "100%" ,"height":"100%"});
            $(".layui-layer.layui-layer-page.layer-anim img").css({"width":"100%","height":"100%"});
        }

        // if(imgWidth >0 && imgHeight > 0){
         //    var iframeWidth = $(window).width();
         //    var iframeHeight = $(window).height();
        //
         //    var imgTop = 0;
        //
         //    if(imgWidth > imgHeight){
         //        imgTop = 60;
         //        if(imgWidth > iframeWidth-50){
         //            imgWidth = '90%';
         //        } else {
         //            imgWidth = '75%';
         //        }
         //        if(imgHeight > 850){
         //            imgHeight = '850';
         //        } else {
         //            imgHeight = '700';
         //        }
         //    }else{
         //        imgTop = 30;
         //        if(imgHeight > iframeHeight-50){
         //            imgHeight = '90%';
         //        } else {
         //            imgHeight = '75%';
         //        }
         //        imgWidth = '600';
         //        if(imgWidth > 850){
         //            imgWidth = '850';
         //        } else {
         //            imgWidth = '700';
         //        }
         //    }
        //
		// 	layer.open({
		// 		type : 1,
		// 		title : false,
		// 		closeBtn : 1,
         //        skin: 'yourclass',
		// 		area : [ imgWidth, imgHeight ],
		// 		// skin : 'layui-layer-nobg', //没有背景色
		// 		shadeClose : true,
		// 		scrollbar : false,
		// 		content : $("#imgDiv")
		// 	});
         //    // 去掉蒙版层
		// 	$(".layui-layer-shade").css("display","none");
		// 	// 给蒙版层添加5像素灰边较为醒目
		// 	$(".layui-layer-content").css({
         //        "overflow": "hidden",
		// 		"border": "5px solid #d1d1d1"
		// 	})
         //    // var imgTop = (950-imgHeight)/2;
         //    // imgTop += "px";
         //    // console.log(imgTop);
         //    // $(".layui-layer.layui-layer-page.layer-anim").css("top",imgTop);
         //    // $(".layui-layer.layui-layer-page.layer-anim img").css("width","100%");
         //    imgTop += "px";
         //    console.log(imgTop);
         //    $(".layui-layer.layui-layer-page.layer-anim").css("top",imgTop);
         //    $(".layui-layer.layui-layer-page.layer-anim img").css({"width":"100%","height":"100%"});
		// }
	});
}

function getImageWidth(url, callback) {
	var img = new Image();
	img.src = url;
	// 如果图片被缓存，则直接返回缓存数据
	if (img.complete) {
		callback(img.width, img.height);
	} else {
		// 完全加载完毕的事件
		img.onload = function() {
			callback(img.width, img.height);
		}
	}
}