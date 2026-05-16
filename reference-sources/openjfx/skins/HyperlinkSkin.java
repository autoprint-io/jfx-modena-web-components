package javafx.scene.control.skin;

import com.sun.javafx.scene.control.behavior.BehaviorBase;
import javafx.scene.control.Control;
import javafx.scene.control.Hyperlink;

import com.sun.javafx.scene.control.behavior.ButtonBehavior;

/**
 * Default skin implementation for the {@link Hyperlink} control.
 *
 * @see Hyperlink
 * @since 9
 */
public class HyperlinkSkin extends LabeledSkinBase<Hyperlink> {

    /* *************************************************************************
     *                                                                         *
     * Private Fields                                                          *
     *                                                                         *
     **************************************************************************/

    private final BehaviorBase<Hyperlink> behavior;



    /* *************************************************************************
     *                                                                         *
     * Constructors                                                            *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new HyperlinkSkin instance, installing the necessary child
     * nodes into the Control {@link Control#getChildren() children} list, as
     * well as the necessary input mappings for handling key, mouse, etc events.
     *
     * @param control The control that this skin should be installed onto.
     */
    public HyperlinkSkin(Hyperlink control) {
        super(control);

        // install default input map for the Hyperlink control
        behavior = new ButtonBehavior<>(control);
//        control.setInputMap(behavior.getInputMap());
    }



    /* *************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /** {@inheritDoc} */
    @Override public void dispose() {
        super.dispose();

        if (behavior != null) {
            behavior.dispose();
        }
    }
}
