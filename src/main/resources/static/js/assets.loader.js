let assets_path;
function assets_path_init(assets_root, type){
    assets_path = assets_root + '/' + type;
}
function getResource(assets){
    return assets_path + '/' + assets;
}