/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as axMocks from 'laxar-mocks';
import * as ng from 'angular';
import 'angular-mocks';

describe( 'A laxar-popup-widget', () => {

   let widgetEventBus;
   let widgetScope;
   let testEventBus;

   let modalService;
   let replies;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( () => {
         ng.mock.inject( axPopupWidgetModalService => {
            modalService = axPopupWidgetModalService;
            spyOn( modalService, 'setClassOnBody' );
            spyOn( modalService, 'unsetClassOnBody' );
         } );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( () => {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;

         axMocks.triggerStartupEvents();
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defaultFeatures() {
      return {
         open: {
            onActions: [ 'myOpenAction' ]
         },
         close: {
            onActions: [ 'myCloseAction' ]
         },
         area: {
            name: 'popup-area'
         },
         visibility: {
            flag: 'visible-popup'
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   describe( 'when receiving the action of the open feature', () => {

      let visibilityFlagSpy;

      createSetup( defaultFeatures() );

      beforeEach( done => {
         visibilityFlagSpy = jasmine.createSpy( 'visibilityFlagSpy' );
         testEventBus.subscribe( 'didChangeFlag', visibilityFlagSpy );

         const action = 'myOpenAction';
         testEventBus
            .publishAndGatherReplies( `takeActionRequest.${action}`, {
               action,
               anchorDomElement: 'popup_layer'
            } )
            .then( arg => { replies = arg; } );

         testEventBus.drainAsync().then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the class "modal-open" on body (R1.4)', () => {
         expect( modalService.setClassOnBody ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'reads the anchor element from the according takeActionRequest (R3.1)', () => {
         expect( widgetScope.model.anchorElementId ).toEqual( 'popup_layer' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a flag indicating its visibility (R4.1)', () => {
         const [ event, meta ] = visibilityFlagSpy.calls.argsFor( 0 );
         expect( meta.name ).toEqual( 'didChangeFlag.visible-popup.true' );
         expect( event.flag ).toEqual( 'visible-popup' );
         expect( event.state ).toEqual( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'triggers a change request for itself', () => {
         expect( widgetEventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
            'changeWidgetVisibilityRequest.test-widget.true', {
               widget: 'test-widget',
               visible: true
            }, jasmine.any( Object )
         );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with area configuration', () => {

      createSetup( defaultFeatures() );

      beforeEach( done => {
         testEventBus.publish( 'changeAreaVisibilityRequest.test-widget.content.true', {
            area: 'test-widget.content',
            visible: true
         } );
         testEventBus.drainAsync().then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'processes change requests for the visibility of them (R4.3)', () => {
         expect( widgetEventBus.publish ).toHaveBeenCalledWith(
            'didChangeAreaVisibility.test-widget.content.false', {
               area: 'test-widget.content',
               visible: false
            }, jasmine.any( Object )
         );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when receiving the action of the close feature', () => {

      createSetup( {
         ...defaultFeatures(),
         forcedClose: {
            action: 'closedByUser'
         },
         closeIcon: {
            enabled: true
         },
         backdropClose: {
            enabled: true
         }
      } );

      let visibilityFlagSpy;

      beforeEach( done => {
         testEventBus.publish( 'takeActionRequest.myOpenAction', {
            action: 'myOpenAction',
            anchorDomElement: 'anchorElementThingy'
         } );
         testEventBus.drainAsync().then( done, done.fail );
      } );

      beforeEach( done => {
         spyOn( widgetScope.model.layerConfiguration, 'whenClosed' ).and.callThrough();
         spyOn( widgetScope, '$broadcast' );

         visibilityFlagSpy = jasmine.createSpy( 'visibilityFlagSpy' );
         testEventBus.subscribe( 'didChangeFlag', visibilityFlagSpy );

         const action = 'myCloseAction';
         testEventBus
            .publishAndGatherReplies( `takeActionRequest.${action}`, {
               action
            } )
            .then( arg => { replies = arg; } );

         testEventBus.drainAsync().then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'removes the class "modal-open" on body (R1.4)', () => {
         expect( modalService.unsetClassOnBody ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a flag indicating its visibility (R4.1)', () => {
         const [ event, meta ] = visibilityFlagSpy.calls.argsFor( 0 );
         expect( meta.name ).toEqual( 'didChangeFlag.visible-popup.false' );
         expect( event.flag ).toEqual( 'visible-popup' );
         expect( event.state ).toEqual( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'responds with a didTakeAction event to the first configured close action (R5.1)', () => {
         expect( replies[ 0 ].meta.name ).toEqual( 'didTakeAction.myCloseAction.SUCCESS' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'on close icon click triggers a forced close (R6.3)', () => {
         widgetScope.model.handleCloseIconClicked();

         expect( widgetScope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a configured action in the takeActionRequest event when closed by force (R7.1)', () => {
         const mySpy = jasmine.createSpy();
         testEventBus.subscribe( 'takeActionRequest', mySpy );

         widgetScope.model.layerConfiguration.whenClosed( true );
         testEventBus.flush();

         const [ event, meta ] = mySpy.calls.argsFor( 0 );
         expect( meta.name ).toEqual( 'takeActionRequest.closedByUser' );
         expect( event.action ).toEqual( 'closedByUser' );
         expect( event.anchorDomElement ).toEqual( 'anchorElementThingy' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'backdrop click triggers a forced close (R12.1)', () => {
         widgetScope.model.handleBackdropClicked();

         expect( widgetScope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when receiving an open action with feature preventBodyScrolling enabled', () => {

      createSetup( {
         ...defaultFeatures(),
         preventBodyScrolling: {
            enabled: true
         }
      } );

      beforeEach( done => {
         testEventBus.publish( 'takeActionRequest.myOpenAction', {
            action: 'myOpenAction',
            anchorDomElement: 'anchorElementThingy'
         } );
         testEventBus.drainAsync().then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'simply forwards a truthy enabled value to the layer (R11.1)', () => {
         expect( widgetScope.model.layerConfiguration.preventBodyScrolling ).toBe( true );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when receiving an open action with feature preventBodyScrolling not enabled', () => {

      createSetup( {
         ...defaultFeatures(),
         preventBodyScrolling: {
            enabled: false
         }
      } );

      beforeEach( done => {
         testEventBus.publish( 'takeActionRequest.myOpenAction', {
            action: 'myOpenAction',
            anchorDomElement: 'anchorElementThingy'
         } );
         testEventBus.drainAsync().then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'simply forwards a falsy enabled value to the layer (R11.1)', () => {
         expect( widgetScope.model.layerConfiguration.preventBodyScrolling ).toBe( false );
      } );

   } );

} );
