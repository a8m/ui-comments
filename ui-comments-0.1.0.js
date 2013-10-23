angular.module('ui.comments', [
  'ui.comments.tpls',
  'ui.comments.directive'
]);
angular.module('ui.comments.tpls', [
  'template/comments/comment.html',
  'template/comments/comments.html'
]);
angular.module('ui.comments.directive', []).provider('commentsConfig', function () {
  var config = {
      containerTemplate: 'template/comments/comments.html',
      commentTemplate: 'template/comments/comment.html',
      orderBy: 'best',
      commentController: undefined
    };
  var emptyController = function () {
  };
  function stringSetter(setting, value) {
    if (typeof value === 'string') {
      config[setting] = value;
    }
  }
  function controllerSetter(setting, value) {
    if (value && (angular.isString(value) && value.length || angular.isFunction(value) || angular.isArray(value))) {
      config[setting] = value;
    } else {
      config[setting] = emptyController;
    }
  }
  var setters = {
      'containerTemplate': stringSetter,
      'commentTemplate': stringSetter,
      'orderBy': stringSetter,
      'commentController': controllerSetter
    };
  this.$get = function () {
    return config;
  };
  this.set = function (name, value) {
    var fn, key, props, i;
    if (typeof name === 'string') {
      fn = setters[name];
      if (fn) {
        fn(name, value);
      }
    } else if (typeof name === 'object') {
      props = Object.keys(name);
      for (i = 0; i < props.length; ++i) {
        key = props[i];
        fn = setters[key];
        if (fn) {
          fn(key, name[key]);
        }
      }
    }
  };
}).directive('comments', [
  '$compile',
  'commentsConfig',
  function ($compile, commentsConfig) {
    return {
      restrict: 'EA',
      require: ['?^comment'],
      transclude: true,
      replace: true,
      templateUrl: function () {
        return commentsConfig.containerTemplate;
      },
      scope: { 'comments': '=commentData' },
      controller: function () {
      },
      compile: function () {
        return function (scope, elem, attr, ctrl) {
          attr.$observe('orderBy', function (newval, oldval) {
            scope.commentOrder = newval || commentsConfig.orderBy;
          });
        };
      }
    };
  }
]).directive('comment', [
  '$compile',
  'commentsConfig',
  '$controller',
  function ($compile, commentsConfig, $controller) {
    return {
      require: [
        '^comments',
        'comment'
      ],
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: function () {
        return commentsConfig.commentTemplate;
      },
      scope: { comment: '=commentData' },
      controller: [
        '$scope',
        function ($scope) {
        }
      ],
      compile: function (scope, elem) {
        return function (scope, elem, attr, ctrls) {
          var comments = ctrls[0], comment = ctrls[1];
          var controller = commentsConfig.commentController, controllerInstance;
          if (controller) {
            controllerInstance = $controller(controller, {
              '$scope': scope,
              '$element': elem
            });
            if (controllerInstance) {
              elem.data('$CommentController', controllerInstance);
            }
          }
          if (elem.parent().attr('child-comments') === 'true') {
            elem.addClass('child-comment');
          }
          var children = false, compiled, sub = angular.element('<comments child-comments="true" ' + 'comment-data="comment.children"></comments>'), transclude;
          function update(data) {
            if (!angular.isArray(data)) {
              data = [];
            }
            if (data.length > 0 && !children) {
              compiled = $compile(sub)(scope);
              var w = scope.$watch('$$phase', function (val) {
                  w();
                  if (comment.commentsTransclude) {
                    transclude = comment.commentsTransclude.clone();
                    comment.commentsTransclude.replaceWith(compiled);
                  } else {
                    elem.append(compiled);
                  }
                  children = true;
                  elem.triggerHandler('filled.comments', compiled);
                });
            } else if (!data.length && children) {
              children = false;
              if (comment.commentsTransclude && transclude) {
                comment.commentsTransclude.replaceWith(transclude);
              } else {
                compiled.remove();
              }
              compiled = transclude = undefined;
              elem.triggerHandler('emptied.comments');
            }
          }
          scope.$watch('comment', function (newval) {
            update(scope.comment.children);
          }, true);
        };
      }
    };
  }
]).directive('commentsTransclude', function () {
  return {
    restrict: 'EA',
    require: '^comment',
    link: {
      pre: function (scope, element, attr, comment) {
        comment.commentsTransclude = element;
      }
    }
  };
});
angular.module('template/comments/comment.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/comments/comment.html', '<div class="comment">\n' + '  <div class="comment-header">\n' + '    <span class="comment-user">\n' + '      <a class="comment-username" ng-if="comment.profileUrl" ng-href="{{comment.profileUrl}}" title="{{comment.name}}">{{comment.name}}</a>\n' + '      <img class="comment-avatar" ng-if="comment.avatarUrl" ng-src="{{comment.avatarUrl}}" alt="{{comment.name}}" />\n' + '      <span class="comment-username" ng-if="!comment.profileUrl">{{comment.name}}</span>\n' + '      <span class="comment-date" ng-if="comment.date">{{comment.date}}</span>\n' + '  </div>\n' + '  <div class="comment-body" ng-bind="comment.text">\n' + '      <child-comments comment-data="comment.children"></child-comments>\n' + '  </div>\n' + '</div>');
  }
]);
angular.module('template/comments/comments.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('template/comments/comments.html', '<div class="comments">\n' + '  <comment ng-repeat="comment in comments" comment-data="comment"></comment>\n' + '</div>\n' + '');
  }
]);