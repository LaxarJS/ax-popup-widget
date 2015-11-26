/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   '../ax-popup-widget',
   'laxar/laxar_testing'
], function( descriptor, controller, ax ) {
   'use strict';

   describe( 'An AxPopupWidget', function() {

      describe( 'with a configured onActions property of open feature', function() {

         var testBed;
         var replies;

         function publishTakeActionRequestWithAction( action ) {
            testBed.eventBusMock
               .publishAndGatherReplies( 'takeActionRequest.' + action, {
                  action: action,
                  anchorDomElement: 'popup_layer'
               } ).then( function( arg ) {
                  replies = arg;
               } );
            jasmine.Clock.tick( 0 );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            testBed = testBedAfterDidNavigate( this, defaultFeatures() );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach( function() {
            tearDown( testBed );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the class "modal-open" on body (R1.4)', function() {
            spyOn( testBed.injections.modalService , 'setClassOnBody' );
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( testBed.injections.modalService.setClassOnBody ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'reads the anchor element from the according takeActionRequest (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( testBed.scope.model.anchorElementId ).toEqual( 'popup_layer' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the first configured open action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( replies[ 0 ].meta.name ).toEqual( 'didTakeAction.myOpenAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the second configured open action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOtherOpenAction' );

            expect( replies[ 0 ].meta.name ).toEqual( 'didTakeAction.myOtherOpenAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing for the wrong open action action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myFalseOpenAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing on successive events', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a flag indicating its visibility (R4.1)', function() {
            var mySpy = jasmine.createSpy();
            testBed.eventBusMock.subscribe( 'didChangeFlag', mySpy );
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( mySpy.calls[ 0 ].args[ 1 ].name ).toEqual( 'didChangeFlag.visible-popup.true' );
            expect( mySpy.calls[ 0 ].args[ 0 ].flag ).toEqual( 'visible-popup' );
            expect( mySpy.calls[ 0 ].args[ 0 ].state ).toEqual( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'processes change requests for the visibility of the provided areas (R4.3)', function() {
            expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith(
               'changeAreaVisibilityRequest.popup', jasmine.any( Function )
            );

            testBed.eventBusMock.publish( 'changeAreaVisibilityRequest.popup.content.true', {
               area: 'popup.content',
               visible: true
            } );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.popup.content.false', {
                  area: 'popup.content',
                  visible: false
               }, jasmine.any( Object )
            );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'triggers change requests for the visibility of the provided areas when opened/closed (R4.4)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );
            expect( testBed.scope.eventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.popup.true', {
                  widget: 'popup',
                  visible: true
               }, jasmine.any( Object )
            );

            testBed.eventBusMock.publish( 'changeAreaVisibilityRequest.popup.content.true', {
               area: 'popup.content',
               visible: true
            } );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.popup.content.true', {
                  area: 'popup.content',
                  visible: true
               }, jasmine.any( Object )
            );


            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( testBed.scope.eventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.popup.false', {
                  widget: 'popup',
                  visible: false
               }, jasmine.any( Object )
            );

            testBed.eventBusMock.publish( 'changeAreaVisibilityRequest.popup.content.false', {
               area: 'popup.content',
               visible: false
            } );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.popup.content.false', {
                  area: 'popup.content',
                  visible: false
               }, jasmine.any( Object )
            );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured onActions property of close feature', function() {

         var testBed;
         var replies;

         function publishTakeActionRequestWithAction( action ) {
            testBed.eventBusMock
               .publishAndGatherReplies( 'takeActionRequest.' + action, {
                  action: action
               } ).then( function( arg ) {
                  replies = arg;
               } );
            jasmine.Clock.tick( 0 );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            var features = defaultFeatures();
            features.forcedClose = {
               action: 'closedByUser'
            };
            features.closeIcon = {
               enabled: true
            };
            features.backdropClose = {
               enabled: true
            };
            testBed = testBedAfterDidNavigate( this, features );
            testBed.eventBusMock.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            jasmine.Clock.tick( 0 );
            spyOn( testBed.scope.model.layerConfiguration, 'whenClosed' ).andCallThrough();
            spyOn( testBed.scope, '$broadcast' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach( function() {
            tearDown( testBed );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'removes the class "modal-open" on body (R1.4)', function() {
            spyOn( testBed.injections.modalService , 'unsetClassOnBody' );
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( testBed.injections.modalService.unsetClassOnBody ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a flag indicating its visibility (R4.1)', function() {
            var mySpy = jasmine.createSpy();
            testBed.eventBusMock.subscribe( 'didChangeFlag', mySpy );
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( mySpy.calls[ 0 ].args[ 1 ].name ).toEqual( 'didChangeFlag.visible-popup.false' );
            expect( mySpy.calls[ 0 ].args[ 0 ].flag ).toEqual( 'visible-popup' );
            expect( mySpy.calls[ 0 ].args[ 0 ].state ).toEqual( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the first configured close action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( replies[0].meta.name ).toEqual( 'didTakeAction.myCloseAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the second configured close action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myOtherCloseAction' );

            expect( replies[0].meta.name ).toEqual( 'didTakeAction.myOtherCloseAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing for the wrong close action action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myFalseCloseAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'on close icon click triggers a forced close (R6.3)', function() {
            testBed.scope.model.handleCloseIconClicked();

            expect( testBed.scope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a configured action in the takeActionRequest event when closed by force (R7.1)', function() {
            var mySpy = jasmine.createSpy();
            testBed.eventBusMock.subscribe( 'takeActionRequest', mySpy );

            testBed.scope.model.layerConfiguration.whenClosed( true );
            jasmine.Clock.tick( 0 );

            expect( mySpy.calls[ 0 ].args[ 1 ].name ).toEqual( 'takeActionRequest.closedByUser' );
            expect( mySpy.calls[ 0 ].args[ 0 ].action ).toEqual( 'closedByUser' );
            expect( mySpy.calls[ 0 ].args[ 0 ].anchorDomElement ).toEqual( 'anchorElementThingy' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'backdrop click triggers a forced close (R12.1)', function() {
            testBed.scope.model.handleBackdropClicked();

            expect( testBed.scope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature preventBodyScrolling', function() {

         it( 'simply forwards a truthy enabled value to the layer (R11.1)', function() {
            var features = defaultFeatures();
            features.preventBodyScrolling = {
               enabled: true
            };
            var testBed = testBedAfterDidNavigate( this, features );

            testBed.eventBusMock.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.layerConfiguration.preventBodyScrolling ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'simply forwards a falsy enabled value to the layer (R11.1)', function() {
            var features = defaultFeatures();
            features.preventBodyScrolling = {
               enabled: false
            };
            var testBed = testBedAfterDidNavigate( this, features );

            testBed.eventBusMock.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.model.layerConfiguration.preventBodyScrolling ).toBe( false );
         } );

      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function testBedAfterDidNavigate( self, features ) {
      var testBed = ax.testing.portalMocksAngular.createControllerTestBed( descriptor );
      testBed.useWidgetJson();
      testBed.featuresMock = features;
      testBed.widgetMock.id = 'popup';
      testBed.injections = {
         LayoutLoader: {
            load: function( layout ) {
               return {
                  html: '',
                  css: '',
                  className: ''
               };
            }
         },
         modalService: {
            setClassOnBody: function(){},
            unsetClassOnBody: function(){}
         }
      };

      testBed.setup();

      testBed.scope.eventBus.publish( 'didNavigate' );
      jasmine.Clock.tick( 0 );

      return testBed;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function tearDown( testBed ) {
      testBed.tearDown();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defaultFeatures() {
      return  {
         open: {
            onActions: [ 'myOpenAction', 'myOtherOpenAction' ]
         },
         close: {
            onActions: [ 'myCloseAction', 'myOtherCloseAction' ]
         },
         content: {
            layout: 'popup_layout'
         }
      };
   }

} );
