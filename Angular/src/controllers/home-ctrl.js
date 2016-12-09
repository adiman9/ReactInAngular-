function HomeCtrl($scope) {
  console.log("Home controller.");
  
  // for debugging:
  window.scope = $scope;

  $scope.message = "world";
};

export {HomeCtrl};
