function MenuMangager(id){
    this.ctx = $(`#${id}`)[0];
    this.activeLayer = "";

    this.typeTitle = ["图片", "曲线"];
    this.typeName = ["pic", "cur"];

    this.layers = [0, 0, 0];
}

function loadPic(e){
    if(canvasManager.loadPicture(e)){
        newLayer(0);
    }
}

function newCurve(){
    if(canvasManager.newCurve()){
        var id = `${typeName[1]}-${layers[1]}`;
        newLayer(1, id);
        setActiveLayer(id, 0);
        layers[1]++;
    }
}

function deleteLayer(){
    if(activeLayer){
        task5Curve.deleteCurve();
        $(`#${activeLayer}`).remove();
        activeLayer = "";
    }
}

function setActiveLayer(id, check){
    console.log("set active layer " + id);
    if(check){
        if(!task5Curve.closed){
            alert("Please close this curve before switching layer!");
            return;
        }
        if(id.substr(0, 3) === typeName[1]){
            task5Curve.setActiveCurve(parseInt(id.substr(4)));
        }
    }
    if(activeLayer){
        $("#"+activeLayer).removeClass("active");
    }
    activeLayer = id;
    $("#"+activeLayer).addClass("active");
}

function newLayer(type, id){
    var layer = [`<div class = "layer-display" id = "${id}">`,
                    '<div class = "infor">',
                        '<span class = "demo-image"><image/></span>',
                        `<span class = "title">${typeTitle[type]} ${layers[type]}</span>`,
                    '</div>',
                    '<div>',
                        '<button class = "btn-show-toggle" onclick = ""><span class="icon-eye"></span></button> ',
                        '<button class = "btn-paint-layer"><span class="icon-paint"></span></button>',
                    '</div>',
                '</div>'].join("");
    $('#layer-container').append(layer);
    $('#' + id).click(function(){
        setActiveLayer(id, 1);
    });
}