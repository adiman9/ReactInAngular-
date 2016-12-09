export const ReactApp = () => {
  return {
    restrict: 'E',
    template: '<div id="ReactApp"></div>',
    link($scope, $element, $attrs) {
      console.log('inside react app directive');        

      var script = document.createElement('script');

      script.setAttribute('src','reactClient.min.js');

      document.head.appendChild(script);
    }
  }
};

export {ReactApp}
