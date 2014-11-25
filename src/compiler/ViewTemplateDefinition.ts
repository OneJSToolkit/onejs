/// <summary>
/// Schema for a OneJS template, describes the element structure, what attributes are expected
/// and how they are parsed.
/// </summary>
/// <remarks>
/// TODO: There should be regex matches defined for attributes so that we can validate
/// they are acceptable.
/// </remarks>
var ViewTemplateDefinition = {
    'js-view': {
        description: '',
        attributes: {
            'js-name': {
                description: 'Defines the member name for the control.',
                example: 'listView'
            },
            'js-type': {
                description: 'Defines the child view type.',
                example: 'ListView'
            },
            'js-model': {},
            'js-css': {},
            'js-options': {}
        },
        children: ['default', 'js-view']
    },
    'js-control': {
        description: 'Indicates that a child view should be placed here.',
        example: '<js-control js-name="listView" js-type="ListView" />',
        attributes: {
            'js-name': {
                description: 'Defines the member name for the control.',
                example: 'listView',
                isRequired: true
            },
            'js-type': {
                description: 'Defines the child view type.',
                example: 'ListView',
                isRequired: true
            },
            'js-data': {
                description: 'Provides control-specific options to use for initialization.',
                example: '{ color: \'black\'}'
            }
        },
        children: []
    },

    'js-state': {
        attribute: {
            'js-name': {
                description: 'Defines the state to expose from the viewModel for testing purposes.',
                example: 'isVideoPlaying'
            }
        },
        children: []
    },

    'js-if': {
        description: 'Conditional region',
        attributes: {
            'source': {
                description: 'The property that provides the condition for the if'
            }
        },
        children: [
            'js-section',
            'js-control',
            'js-view',
            'js-repeat',
            'default'
        ]
    },

    'js-repeat': {
        description: 'Repeated region',
        attributes: {
            'source': {
                description: 'The property that provides the List to repeat'
            },
            'iterator': {
                description: 'The name of the iterator for binding purposes'
            }
        },
        children: [
            'js-section',
            'js-control',
            'js-view',
            'js-if',
            'default'
        ]
    },

    'default': {
        description: 'Match for any html element.',
        example: '<div></div>',
        attributes: {
            'js-bind': {
                description: 'Defines bindings to apply to the given element.',
                example: 'href:linkUrl, text:linkText, className.isEnabled:isLinkEnabled, style.display:isVisible'
            },
            'js-userAction': {
                description: 'Defines events to apply to the given element.',
                example: 'click:onClick, mousemove:onMouseMove'
            },
            'js-id': {
                description: 'Defines an id for the element so that on activation the view can find the element and provide it to the view model on activation.'
            }
        },
        children: [
            'js-section',
            'js-control',
            'js-view',
            'js-if',
            'js-repeat',
            'default'
        ]
    }
};

export = ViewTemplateDefinition;