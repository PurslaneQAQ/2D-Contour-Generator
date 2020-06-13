function MenuManager(id){
    this.menuBar = $(`#${id}`)[0];
    this.activeLayer = "";
}

MenuManager.prototype.loadPic = function(files){
    let file = files[0];
    //console.log(file);
    let reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
        //将结果显示到canvas
        let img = new Image();
        img.src = reader.result;
        img.onload = () => {
            let id = canvasManager.loadPicture(img);
            this.newLayer(0, id);
            this.setActiveLayer(id, 1);
            return true;
        }
    }
}

MenuManager.prototype.newCurve = function(){
    let layerId = canvasManager.newCurve();
    if(layerId != -1){
        this.newLayer(1, layerId);
        this.setActiveLayer(layerId, 0);
        return true;
    }
}

MenuManager.prototype.newPointSet = function(){
    let layerId = canvasManager.newPointSet()
    if(layerId != -1){
        this.newLayer(2, layerId);
        this.setActiveLayer(layerId, 1);
        return true;
    }
}

MenuManager.prototype.loadMesh = function(files){
    var file = files[0];
    if (!file) {
        return;
    }
    let reader = new FileReader();
    reader.onload = () => {
        var contents = reader.result;
        let layerId = canvasManager.loadMesh(contents);
        if(!$(layerId)[0])this.newLayer(3, layerId);
        this.setActiveLayer(layerId, 1);
        return true;
    };
    reader.readAsText(file);
}

MenuManager.prototype.deleteLayer = function(){
    console.log("Tring to delete: "+ this.activeLayer);
    if(!this.activeLayer)return;
    if(this.activeLayer.substr(0, 2) === typeName[0]){
        canvasManager.deletePic();
        $(`#${this.activeLayer}`).remove();
        this.activeLayer = "";
    }
    else if(this.activeLayer.substr(0, 2) === typeName[1]){
        canvasManager.deleteCurve();
        closeCurveEvent();
        $(`#${this.activeLayer}`).remove();
        this.activeLayer = "";
    }
    else if(this.activeLayer.substr(0, 2) === typeName[2]){
        canvasManager.deletePtSet();
        $(`#${this.activeLayer}`).remove();
        this.activeLayer = "";
    }
    else if(this.activeLayer.substr(0, 2) === typeName[3]){
        canvasManager.deleteMesh();
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
                        `<input class = "title" value="${typeTitle[type]} ${id.substr(3)}"  maxlength="15" size="15">`,
                    '</div>',
                    '<div>',
                        '<button class = "btn-show-toggle" onclick = ""><span class="icon-eye"></span></button> ',
                        //'<button class = "btn-paint-layer"><span class="icon-paint"></span></button>',
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
        let ind = parseInt(id.substr(3));
        if(canvasManager.getLayerStatus(type, ind) > 0){
            canvasManager.setActiveLayer(type, parseInt(id.substr(3)));
        }else return;
    }
    if(this.activeLayer){
        $("#"+this.activeLayer).removeClass("active");
    }
    this.activeLayer = id;
    $("#"+this.activeLayer).addClass("active");
    $(`input[name=tool-type][value = '${type}']`).prop('checked', true);
}

MenuManager.prototype.setOverview = function(id, url){
    $(`#${id} img`).attr("src", url);
}

MenuManager.prototype.showLayerToggle = function(id, e){
    e.stopPropagation();
    let type = typeMap[id.substr(0, 2)];
    let layerId = parseInt(id.substr(3));
    let status = canvasManager.getLayerStatus(type, layerId);
    if(status > 0){
        if(!canvasManager.hideLayer(type, layerId))return;
        if(status == 2){
            $("#"+id).removeClass("active");
            this.activeLayer = "";
            $(`input[name=tool-type][value = '${type}']`).prop('checked', false);
        }
        $(`#${id}`).addClass("hidden");
        $(`#${id} .btn-show-toggle span`).removeClass("icon-eye").addClass("icon-eye-blocked");
    }
    else if(status == 0){ 
        // if(canvasManager.getCloseStatus()){
        //     this.setActiveLayer(id, 1);
        // }
        // else{
            canvasManager.showLayer(type, layerId);
        //}
        $(`#${id}`).removeClass("hidden");
        $(`#${id} .btn-show-toggle span`).addClass("icon-eye").removeClass("icon-eye-blocked");
    }
}