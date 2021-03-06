
set class RubyAutoloadAssociation
category: 'as yet unclassified'
classmethod:
newWithKey: aKey file: aFileName
	^ (super newWithKey: aKey) initializeWithFile: aFileName .

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
definedQ
    ^ 'constant' copy

%


set class RubyAutoloadAssociation
category: 'as yet unclassified'
method:
fileName
	^ fileName

%


set class RubyAutoloadAssociation
category: 'as yet unclassified'
method:
initializeWithFile: aFileName
	super initialize .
	isLoaded := false .
	fileName := aFileName . 
	^ self .
	

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
isDefined
	"If we haven't tried to load from the file, then we should consider
	 ourselves as defined.  After we have tried to load the file, then
	 we are defined or not based on the results of that load."
	isLoaded ifNil: [ ^ true ] . "We are in the process of loading"
	^isLoaded ifTrue: [ isDefined ]
	          ifFalse: [ true ] .
	

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
isDefinedForResolve: aSymbol inClass: aClass env: envId 
  "returns a RubySymbolAssociation or nil "

  isLoaded == false ifTrue:[  "initiate autoload"
     " the result may be a different association from a parent name space"
     ^ self _assocFor: aSymbol inClass: aClass env: envId error: true 
  ].
  isDefined ifNotNil:[ ^ self ].
  ^ nil

%


set class RubyAutoloadAssociation
category: 'as yet unclassified'
method:
isLoaded
	^ isLoaded

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
_assocFor: aSymbol inClass: aClass env: envId error: errIfMissingBool
  "If we haven't loaded our file, then we load the file (which should actually define us...
   Returns an association or nil. "
  | res |
  isLoaded == false ifTrue:[  | tassoc rassoc |
    [ self isCommitted ifTrue:[ | tns |  "Fix Trac 836"
        tns := aClass transientNameSpaceForStore: envId.
        tassoc := tns associationAt: aSymbol otherwise: nil .
        tassoc ifNil:[ tns addTransientAssociation: (tassoc := self copy) ]
           ifNotNil:[ tassoc ~~ self ifTrue:[ NameError signal:'inconsistent tassoc in autoload'.]].
      ] ifFalse:[
        tassoc := self
      ].
      tassoc _isLoaded: nil . "prevent infinite recursion"
      "RubyContext loadFileNamed: fileName ."
      "We need the semantics of Kernel#require (file handling and management of
	 $LOADED_FEATURES) but what object to call it on?
	 I suspect there may be issues using the association as self.  We may need
	 to pass the module in at associatio creation and use the module?

      Do not do perform: #require.  RubyGems redefines require in a way
      that triggers an autoload.  If we send #require to load the autoload file,
      we re-trigger the current autoload, which is now in an inconsistent state."        
      RubyContext default requireFileNamed: fileName env: envId .
      tassoc _isLoaded: true .              
      rassoc := aClass rubyConstAssociationAtOrNil: aSymbol env: envId .
      rassoc == tassoc ifFalse:[ AbstractException signal:'after require from autoload, inconsistent assoc'].
      tassoc isDefined ifNotNil:[ 
	res := tassoc 
      ] ifNil:[ | passoc |
	"Trac 699, the autoload defined the constant, but in a parent name space."
	passoc := aClass rubyAutoloadAssociationAtOrNil: aSymbol env: envId .
	passoc ifNil:[
	  errIfMissingBool ifTrue:[
	    NameError signal:'after require from autoload, uninitialized constant ', key
	  ] ifFalse:[
	    ^ nil
	  ].
	].
	passoc == tassoc ifTrue:[ AbstractException signal:'after require from autoload, inconsistent passoc'].
	res := passoc .
	aClass removeConst: aSymbol env: envId . "remove self from name space of aClass"
      ]   
    ] ensure:[
      tassoc isLoaded ifNil:[  "the require: failed, reset"
	tassoc _isLoaded: false ;
	      _compileTimeValue: nil .  "clear any child NameSpace or Class"
      ].
    ].
  ] ifFalse:[ 
    res := self 
  ].
  ^ res

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
_classFor: aSymbol inModule: aModule env: envId
  self _assocFor: aSymbol inClass: aModule env: envId error: false .
  "caller must re-resolve"
  ^ nil

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
_freezeConstant
  "should not be frozen"
  ^ self

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
_isLoaded: val
  isLoaded := val

%


set class RubyAutoloadAssociation
category: '*maglev-runtime'
method:
_valueFor: aSymbol inClass: aModule env: envId 
  | assoc |
  assoc := self _assocFor: aSymbol inClass: aModule env: envId error: true .
  assoc isDefined ifNil:[ 
     NameError signal:'uninitialized constant ', key , ' from Autoload...>>_valueFor:'
  ].
  ^ assoc _valueNoAction

%


set class RubyAutoloadAssociation
category: 'as yet unclassified'
method:
_valueNoAction
  isLoaded == true ifTrue:[ ^ value ].
  isLoaded == nil ifTrue:[  "load is active on the stack"
	isDefined == true ifTrue:[ ^ value ].
  ].
  ^ nil

%

