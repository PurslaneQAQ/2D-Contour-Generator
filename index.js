const canvasId = "main-canvas";
const menuId = "layer-container";

const layerContainerByType = ["curve-layers", "image-layers", "point-set-layers"];

const newImgId = "new-image";
const newCurveId = "new-curve";
const newPSetId = "new-points";

const hintId = "hint-bar";

var canvasManager = null;	
var menuManager = null;

window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 30);
    };
})();

function draw() {
    canvasManager.drawLayers();
    requestAnimFrame(function() {
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
        showHint("点击Enter闭合曲线；您需要至少3个点来组成一个曲线");
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
        $(`#${newCurveId} span`).removeClass("not-closed icon-closed-curve").add("icon-curve");
        $(`#${newCurveId}`).on("click", newCurveEvent);
    }
}

$(document).on("keydown", function(e){  
    if(e.altKey){
        if(e.shiftKey){
            canvasManager.breakTangent = 0;
        }
        else{
            canvasManager.breakTangent = 1;
        }
    }
    else if(e.keyCode == 13){
        event.preventDefault();
        if(!canvasManager.curveClosed){
            closeCurveEvent();  
        }
    }
});

// Entry point of the project
$(document).ready(function(){
    initialize();
    var dumnFileBtn = $("<input type = 'file' id = 'pic-file' style = 'display: none;' accept='image/jpg,image/jpeg,image/gif,image/png'/>");
    dumnFileBtn.on("change", function(){let that = this; menuManager.loadPic(that.files)});
    $(`#${newImgId}`).parent().prepend(dumnFileBtn);
    $(`#${newImgId}`).on("click", function(){$('#pic-file').click();});
    $(`#${newCurveId}`).on("click", newCurveEvent);
    $(`#${newPSetId}`).on("click", ()=>{menuManager.newPointSet();});
    $("#delete").on("click", menuManager.deleteLayer);
    $("#show-control-plg").on("change", function(){canvasManager.setShowControlPolygon(this.checked)});
    $("#segment-slider").on("input", function(){
        canvasManager.setNumSegments(this.value); 
        printValue('segment-slider','segment-val');
    });
    $("#tension-slider").on("input", function(){
        canvasManager.setInitTension(this.value); 
        printValue('tension-slider','tension-val');
    });
    $("#clear").on("click", menuManager.clearCanvas);
    $("#store").on("click", menuManager.storeLayers);
});
