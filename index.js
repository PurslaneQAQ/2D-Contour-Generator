var canvasManager = null;	
var menuManager = null;
var pause = false;

window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 30);
    };
})();

function draw() {
    canvasManager.drawLayers();
    requestAnimFrame(function() {
        if(!pause)
            draw();
    });
}

function initialize() {
    canvasManager = new CanvasManager(canvasId);
    menuManager = new MenuManager(menuId);
    draw();
}

function printValue(sliderID, textbox) {
    var x = $(`#${textbox}`)[0];
    var y = $(`#${sliderID}`)[0];
    x.value = y.value;
}

function showHint(text){
    $(`#${hintId}`).text(text);
} 

function newCurveEvent(){
    if(menuManager.newCurve()){
        showHint("Press Enter to close the curve；At lease 3 nodes are needed to form a closed curve");
        $(`#${newImgId}`).attr("disabled", true);
        $(`#${newPSetId}`).attr("disabled", true);
        $(`#${newCurveId}`).off();
        $(`#${newCurveId} span`).addClass("not-closed icon-closed-curve").removeClass("icon-curve");
        $(`#${newCurveId}`).on("click", closeCurveEvent);
    }
}

function closeCurveEvent(){
    if(canvasManager.closeCurve()){
        $(`#${hintId}`).text("");
        $(`#${newImgId}`).removeAttr("disabled");
        $(`#${newPSetId}`).removeAttr("disabled");
        $(`#${newCurveId}`).off();
        $(document).off("keyup");
        $(`#${newCurveId} span`).removeClass("not-closed icon-closed-curve").addClass("icon-curve");
        $(`#${newCurveId}`).on("click", newCurveEvent);
    }
}

function preview() {
    let val;
    $("[name=export-option]").each(function (){
        if(this.checked){val = $(this).val();}
    });
    canvasManager.preview(val);
}

function pickColor(e){
    e.preventDefault();
    let {x, y} = getMousePos(e);
    let data = canvasManager.ctx.getImageData(x, y, 1, 1).data;
    let rgb = [ data[0], data[1], data[2] ];
    console.log(`rgb(${rgb.join(',')})`);
    $("#mesh-brush-weight")[0].value = `rgb(${rgb.join(',')})`;
    $("#mesh-brush-weight").change();
    console.log($("#mesh-brush-weight")[0].value)
}

$(`#${canvasId}`).mousedown(function(e){
    if(e.which == 3){
        e.preventDefault();
        if(canvasManager.activeMesh == -1)return;
        $(this).addClass("pick-color");
    }
});

$(`#${canvasId}`).on("contextmenu", function(e){
    e.preventDefault();
    return false;
}, false);

$(`#${canvasId}`).mouseup(function(e){
    if(e.which == 3){
        e.preventDefault();
        if(canvasManager.activeMesh == -1)return;
        $(this).removeClass("pick-color");
        pickColor(e);
        showHint("");
    }
});

$(document).keydown(function(e){  
    if(e.altKey){
        if(canvasManager.activeCurve != -1){
            if(e.shiftKey){
                canvasManager.breakTangent = 0;
            }
            else{
                canvasManager.breakTangent = 1;
            }
        }
        else if (canvasManager.activeMesh != -1){
            $(`#${canvasId}`).addClass("pick-color");
            canvasManager.handleMouseEvent = false;
            $(`#${canvasId}`).on("click", pickColor);
        }
        
    }
    else if(e.keyCode == 13){
        event.preventDefault();
        if(!canvasManager.curveClosed){
            closeCurveEvent();  
        }
    }
    else if(e.keyCode == 46){ // Delelte
        event.preventDefault();
        canvasManager.handleDelete();  
    }
});

// Entry point of the project
$(document).ready(function(){
    initialize();
    var dummyImgFileBtn = $("<input type = 'file' id = 'pic-file' style = 'display: none;' accept='image/jpg,image/jpeg,image/gif,image/png'/>");
    var dummyMeshFileBtn = $("<input type = 'file' id = 'mesh-file' style = 'display: none;' accept='text/txt'/>");
    dummyImgFileBtn.on("input", function(){let that = this; menuManager.loadPic(that.files)});
    dummyMeshFileBtn.on("input", function(){let that = this; showHint("Right click to select color on canvas"); menuManager.loadMesh(that.files)});
    $(`#${newImgId}`).parent().prepend(dummyImgFileBtn);
    $(`#${newImgId}`).on("click", function(){$('#pic-file').click();});
    $(`#${newCurveId}`).on("click", newCurveEvent);
    $(`#${newMeshId}`).parent().prepend(dummyMeshFileBtn);
    $(`#${newMeshId}`).on("click", function(){$('#mesh-file').click();});
    $(`#${newPSetId}`).on("click", menuManager.newPointSet.bind(menuManager));
    $("#delete").on("click", menuManager.deleteLayer.bind(menuManager));
    $("#show-control-plg").on("change", function(){canvasManager.setShowControlPolygon(this.checked)});
    $("#segment-slider").on("input", function(){
        canvasManager.setMinSegment(this.value); 
        printValue('segment-slider','segment-val');
        preview();
    });
    $("#tension-slider").on("input", function(){
        canvasManager.setInitTension(this.value); 
        printValue('tension-slider','tension-val');
    });
    $("#repaint-image").on("click", function(){
        canvasManager.changePicColor($("xy-color-picker")[0].color.toRGBA()); 
    });
    $("#mesh-base-weight").on("change", function(){
        let weight = $("#mesh-base-weight")[0].color.toRGBA();
        weight.a = 1
        weight = weight.toString()
        canvasManager.SetMeshBaseWeight(weight);
        $("#mesh-base-weight-text")[0].value = weight.substr(5, weight.length - 9);
    });
    $("#mesh-brush-weight").on("change", function(){
        let weight = $("#mesh-brush-weight")[0].color.toRGBA();
        weight.a = 1
        weight = weight.toString()
        canvasManager.SetMeshBrushWeight(weight);
        $("#mesh-brush-weight-text")[0].value = weight.substr(5, weight.length - 9);
    });
    $("#brush-size-slider").on("input", function(){
        canvasManager.setBrushSize(this.value);
        printValue("brush-size-slider", "brush-size");
    })
    $("#clear").on("click", menuManager.clearCanvas);
    $("#export").on("click", ()=>{
        pause = true;
        preview();
        $("#export-dialog").removeClass("hide"); 
        $(".wrapper").show(); 
        $(".wrapper").removeClass("hide");
    });
    $("[name=export-option]").on("change", ()=>{
        preview($(this).val());
    })    
    $("#export-file").on("click", ()=>{
        let val;
        $("[name=export-option]").each(function (){
            if(this.checked){val = $(this).val();}
        });
        canvasManager.exportLayers.call(canvasManager, val, $("#export-prefix").val());
    });

    $(".wrapper").hide();
    $(".dialog").on('click', function(e){
        e.cancelBubble=true;
        e.stopPropagation();
    });

    $(".wrapper").on('click', function(e){
        $(".wrapper").addClass("hide");
        pause = false;
        draw();
        setTimeout(()=>{
            $(".wrapper").hide();
            $(".dialog").each(
                d=>{
                    if(!$(d).hasClass("hide"))
                    $(d).addClass("hide");
                }
        )}, 500);
    });
});
