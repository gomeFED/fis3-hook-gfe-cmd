//require Config 正则表达式
var requireConfigExp = /require\.config\((\{[\s\S]*?\})\);?/img;
//sea Config 正则表达式
var seaConfigExp = /seajs\.config\((\{[\s\S]*?\})\);?/img;

var modConfig = {};
/**
 * init 用于处理页面中的config.requier,将其配置提取到编译文件中
 * @param  {Json} fis  fis对象
 * @param  {Json} opts 模块化默认的参数
 * @return {Json} 修改后的参数    
 */
modConfig.init = function(fis, opts) {

	var projectPath = fis.project.getProjectPath();
    var htmlPaths = fis.util.find(projectPath+'/html', /.*\.(html|tpl|ftl)$/, null, null);

    var config;
    var isRequier = true; //默认处理的是requier,为false表示处理的seajs

    htmlPaths.forEach(function(url) {
        var content = fis.util.read(url);
        var isEntryFile = (~content.indexOf('/html') || ~content.indexOf('/HTML')) && (~content.indexOf('/head') || ~content.indexOf('/HEAD')) && (~content.indexOf('/body') || ~content.indexOf('/BODY'));
        if(isEntryFile) {
            var temRegExp = requireConfigExp;
            if(seaConfigExp.test(content)) {
                temRegExp = seaConfigExp;
                isRequier = false;
            }
            content.replace(temRegExp, function(all, $1) {
                var modConfig = superParseJson($1);
                var baseUrl = modConfig.baseUrl||modConfig.base || '';
                var paths = modConfig.paths || {};
                var alias = modConfig.alias;
                if(isRequier) {
                    for(var attr in paths) {
                        modConfig.paths[attr] = baseUrl + paths[attr];
                    }
                    if(modConfig.baseUrl) { delete modConfig.baseUrl;}
                }else {
                    if(alias) {
                        var temPath = {};
                        for(var attr in alias) {
                            temPath[attr] = alias[attr].replace(/(\w+)\//, function(all, path) {
                                return (paths[path] ? baseUrl + paths[path] + '/' : baseUrl + all);
                            }) 
                        }
                        modConfig.paths = temPath;
                    }
                    if(modConfig.alias) {delete modConfig.alias;}
                    if(modConfig.base) { delete modConfig.base;}

                }
                config = config || {};
                Object.assign(config, modConfig);
            });
        }

        if(config) {
	        opts.paths = config.paths;
    	}
    })
	return opts;
}

/**
 * superParseJson 用于处理把字符串json转换成json对象
 * @param  {String} jsonStr 字符串json
 * @return  {Json}  json对象
 */
function superParseJson(jsonStr) {
	return JSON.parse(jsonStr.replace(/\s*/g, '').replace(/,(}|])/g, '$1').replace(/'/g, '"').replace(/(\w+):/g, '"$1":'));
}
module.exports = modConfig;