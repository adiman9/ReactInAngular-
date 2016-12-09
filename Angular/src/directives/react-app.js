export const ReactApp = () => {
  return {
    restrict: 'E',
    templateUrl: 'src/dom/react-component.html',
    link($scope, $element, $attrs) {
      console.log('inside react app directive');        
    }
  }
};

export {ReactApp}
