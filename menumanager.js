const typeTitle = ["图片", "曲线", "点集"];
const typeName = ["pc", "cr", "pt"];
const typeMap = {"pc": 0, "cr": 1, "pt":3};

function MenuManager(id){
    this.menuBar = $(`#${id}`)[0];
    this.activeLayer = "";
}

MenuManager.prototype.loadPic = function(files){
    var file = files[0];
    //console.log(file);
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        //将结果显示到canvas
        var img = new Image();
        img.src = reader.result;
        img.onload = function(){
            canvasManager.loadPicture(img);
        }
    }
    let id = `${typeName[0]}-${canvasManager.pics.length-1}`;
    this.newLayer(0, id);
    return true;
}

MenuManager.prototype.newCurve = function(){
    if(canvasManager.newCurve()){
        let id = `${typeName[1]}-${canvasManager.curves.length-1}`;
        this.newLayer(1, id);
        this.setActiveLayer(id, 0);
        return true;
    }
}

MenuManager.prototype.newPointSet = function(){
    if(canvasManager.newPointSet()){
        // TODO
        let id = `${typeName[2]}-${canvasManager.points.length-1}`;
        this.newLayer(2, id);
        this.setActiveLayer(id, 1);
        return true;
    }
}

MenuManager.prototype.deleteLayer = function(){
    if(!this.activeLayer)return;
    if(this.activeLayer.substr(0, 3) === typeName[1]){
        canvasManager.deleteCurve();
        closeCurveEvent();
        $(`#${this.activeLayer}`).remove();
        this.activeLayer = "";
    }
}

MenuManager.prototype.clearCanvas = function(){
    layerContainerByType.forEach((id)=>{$(`#${id}`).empty();});
    canvasManager.clearCanvas();
}

MenuManager.prototype.newLayer = function(type, id){
    var layer = [`<div class = "layer-display" id = "${id}">`,
                    '<div class = "infor">',
                        '<span class = "demo-image"><image/></span>',
                        `<span class = "title">${typeTitle[type]} ${id.substr(3)}</span>`,
                    '</div>',
                    '<div>',
                        '<button class = "btn-show-toggle" onclick = ""><span class="icon-eye"></span></button> ',
                        '<button class = "btn-paint-layer"><span class="icon-paint"></span></button>',
                    '</div>',
                '</div>'].join("");
    $(`#${layerContainerByType[type]}`).prepend(layer);
    let that = this;
    $(`#${id}`).click(function(){
        that.setActiveLayer(id, 1);
    });
    $(`#${id} .btn-show-toggle`).click(function(e){
        that.showLayerToggle(id, e);
    });
}

MenuManager.prototype.setActiveLayer = function(id, check){
    console.log("set active layer " + id);
    let type = typeMap[id.substr(0, 2)];
    if(check){
        if(id === this.activeLayer)return;
        if(!canvasManager.curveClosed){
            alert("Please close this curve before switching layer!");
            return;
        }
        switch(type){
            case 0 :
                canvasManager.setActiveImg(parseInt(id.substr(3)));
                break;
            case 1:
                canvasManager.setActiveCurve(parseInt(id.substr(3)));
                break;
            case 2:
                canvasManager.setActivePoints(parseInt(id.substr(3)));
                break;
            default: 
                break; 
        }
    }
    if(this.activeLayer){
        $("#"+this.activeLayer).removeClass("active");
    }
    this.activeLayer = id;
    $("#"+this.activeLayer).addClass("active");
}

MenuManager.prototype.showLayerToggle = function(id, e){
    e.stopPropagation();
    let type = typeMap[id.substr(0, 2)];

    switch(type){
        case 0:
            // To do
            break;
        case 1:
            {
                // Must get status before set the status as hidden
                let curveId = parseInt(id.substr(3));
                let status = canvasManager.getCurveStatus(curveId);
                if(status > 0){
                    if(!canvasManager.hideCurve(curveId))return;
                    if(status == 2){
                        $("#"+id).removeClass("active");
                        this.activeLayer = "";
                    }
                    $(`#${id}`).addClass("hidden");
                    $(`#${id} .btn-show-toggle span`).removeClass("icon-eye").addClass("icon-eye-blocked");
                }
                else if(status == 0){ // 
                    if(canvasManager.getCloseStatus()){
                        this.setActiveLayer(id, 1);
                    }
                    else{
                        canvasManager.showCurve(curveId);
                    }
                    console.log("Trying to remove hidden status!");
                    $(`#${id}`).removeClass("hidden");
                    $(`#${id} .btn-show-toggle span`).addClass("icon-eye").removeClass("icon-eye-blocked");
                }
                break;
            }
        case 2:
            // To do
            break;
        default:
            break;
    }
}