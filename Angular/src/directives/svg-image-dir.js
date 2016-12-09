class SvgImageDir {
  constructor(svg_cache_svc) {
    return function(scope, element, attr) {
      var url = attr.svgImage;
      svg_cache_svc.get_svg(url, (contents) => {
        element[0].innerHTML = contents;
      });
    };
  }
}

export {SvgImageDir};
