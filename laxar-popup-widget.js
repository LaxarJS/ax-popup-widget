/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as ng from 'angular';
import { actions, flags, visibility } from 'laxar-patterns';


Controller.$inject = [ '$scope', 'axPopupWidgetModalService' ];

function Controller( $scope, modalService ) {

   $scope.model = {
      popupLayerId: 'popupLayer',
      anchorElementId: null,
      closeIconAvailable: $scope.features.closeIcon.enabled,
      isOpen: false,
      isOpening: false,
      layerConfiguration: {},
      handleCloseIconClicked() {
         if( !$scope.model.closeIconAvailable ) {
            return;
         }
         $scope.$broadcast( 'closeLayerForced' );
      },
      handleBackdropClicked() {
         if( !$scope.features.backdropClose.enabled ) {
            return;
         }
         $scope.$broadcast( 'closeLayerForced' );
      },
      preventClosingPopup( event ) {
         event.stopPropagation();
      }
   };

   actions.handlerFor( $scope )
      .registerActionsFromFeature( 'open', openActionHandler )
      .registerActionsFromFeature( 'close', closeActionHandler );

   const publishVisibilityFlag = flags.publisherForFeature( $scope, 'visibility.flag', { optional: true } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   visibility.handlerFor( $scope, {
      // determine visibility state for nested areas
      onAnyAreaRequest: () => $scope.model.isOpen || $scope.model.isOpening
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.$on( '$destroy', closeActionHandler );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function openActionHandler( { anchorDomElement } ) {
      if( !$scope.model.isOpen ) {
         $scope.model.anchorElementId = anchorDomElement;

         publishVisibilityChange( true )
            .then( () => {
               if( !$scope || !$scope.model ) { return; }
               $scope.model.isOpen = true;
               drawPopup( $scope );
            } );
      }
      drawPopup( $scope );
      modalService.setClassOnBody();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function closeActionHandler() {
      if( $scope.model.isOpen ) {
         $scope.model.isOpen = false;
         publishVisibilityChange( false );
      }
      modalService.unsetClassOnBody();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishVisibilityChange( state ) {
      $scope.model.isOpening = true;
      return publishVisibilityFlag( state )
         .then( () => {
            return visibility.requestPublisherForWidget( $scope )( state )
               .then( () => {
                  if( !$scope || !$scope.model ) { return; }
                  $scope.model.isOpening = false;
               } );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function drawPopup() {
      $scope.model.layerConfiguration = {
         layerElementSelector: `#${$scope.id( $scope.model.popupLayerId )}`,
         positioning: $scope.features.position.vertical.toLowerCase(),
         allowedPositions: [ 'center' ],
         autoFocus: $scope.features.autoFocus.enabled,
         captureFocus: $scope.features.captureFocus.enabled,
         closeByKeyboard: $scope.features.closeIcon.enabled,
         preventBodyScrolling: $scope.features.preventBodyScrolling.enabled,
         closeByOutsideClick: false,
         whenPositioned() {
            applyInternetExplorerCssHack( $scope.id( $scope.model.popupLayerId ) );
         },
         whenClosed( forcedClose ) {
            closeActionHandler();
            // TODO remove check for forcedClose action as soon as
            // https://github.com/LaxarJS/laxar-patterns/issues/89 is resolved
            if( forcedClose && $scope.features.forcedClose.action ) {
               actions.publisherForFeature( $scope, 'forcedClose', { optional: true } )( {
                  anchorDomElement: $scope.model.anchorElementId
               } );
            }
         }
      };
   }

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const modalServiceName = 'axPopupWidgetModalService';
const modalService = [ '$document', $document => {
   return {
      setClassOnBody() {
         $document.find( 'body').addClass( 'modal-open' );
      },
      unsetClassOnBody() {
         $document.find( 'body').removeClass( 'modal-open' );
      }
   };
} ];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function applyInternetExplorerCssHack( popupLayerId ) {
   const style = document.createElement( 'style' );
   if( style.styleSheet ) {
      const head = document.getElementsByTagName( 'head' )[ 0 ];
      style.type = 'text/css';
      style.styleSheet.cssText = '.ax-popup-widget :before,.ax-popup-widget :after{content:none !important';
      head.appendChild( style );
      // eslint-disable-next-line no-unused-expressions
      document.getElementById( popupLayerId ).offsetWidth;
      head.removeChild( style );
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'axPopupWidget', [] )
   .controller( 'AxPopupWidgetController', Controller )
   .factory( modalServiceName, modalService ).name;
