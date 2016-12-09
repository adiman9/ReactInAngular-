var $ = window.$;

class InlineReplaceDir {
  constructor($http, $templateCache, $compile) {
    return function(scope, element, attrs) {
      var templatePath = attrs.inlineReplace;
      $http.get(templatePath, { cache: $templateCache }).success(function(response) {
        var body = $(response);
        $(element).replaceWith(body);
        $compile(body)(scope);
      });
    };
  }
}

export {InlineReplaceDir};
