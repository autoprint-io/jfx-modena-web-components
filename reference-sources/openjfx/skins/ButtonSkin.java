package javafx.scene.control.skin;

import com.sun.javafx.scene.NodeHelper;
import com.sun.javafx.scene.control.behavior.BehaviorBase;
import com.sun.javafx.scene.control.skin.Utils;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.WeakChangeListener;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.ContextMenu;
import com.sun.javafx.scene.control.behavior.ButtonBehavior;
import javafx.scene.control.Control;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyCodeCombination;

/**
 * Default skin implementation for the {@link Button} control.
 *
 * @see Button
 * @since 9
 */
public class ButtonSkin extends LabeledSkinBase<Button> {

    /* *************************************************************************
     *                                                                         *
     * Private fields                                                          *
     *                                                                         *
     **************************************************************************/

    private KeyCodeCombination defaultAcceleratorKeyCodeCombination;
    private KeyCodeCombination cancelAcceleratorKeyCodeCombination;
    private final BehaviorBase<Button> behavior;



    /* *************************************************************************
     *                                                                         *
     * Listeners                                                               *
     *                                                                         *
     **************************************************************************/

    Runnable defaultButtonRunnable = () -> {
        if (getSkinnable().getScene() != null
                && NodeHelper.isTreeVisible(getSkinnable())
                && !getSkinnable().isDisabled()) {
            getSkinnable().fire();
        }
    };

    Runnable cancelButtonRunnable = () -> {
        if (getSkinnable().getScene() != null
                && NodeHelper.isTreeVisible(getSkinnable())
                && !getSkinnable().isDisabled()) {
            getSkinnable().fire();
        }
    };

    ChangeListener<Scene> sceneChangeListener = (ov, oldScene, newScene) -> {
        if (oldScene != null) {
            if (getSkinnable().isDefaultButton()) {
                setDefaultButton(oldScene, false);
            }
            if (getSkinnable().isCancelButton()) {
                setCancelButton(oldScene, false);
            }
        }
        if (newScene != null) {
            if (getSkinnable().isDefaultButton()) {
                setDefaultButton(newScene, true);
            }
            if (getSkinnable().isCancelButton()) {
                setCancelButton(newScene, true);
            }
        }
    };
    WeakChangeListener<Scene> weakSceneChangeListener = new WeakChangeListener<>(sceneChangeListener);


    /* *************************************************************************
     *                                                                         *
     * Constructors                                                            *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new ButtonSkin instance, installing the necessary child
     * nodes into the Control {@link Control#getChildren() children} list, as
     * well as the necessary input mappings for handling key, mouse, etc events.
     *
     * @param control The control that this skin should be installed onto.
     */
    public ButtonSkin(Button control) {
        super(control);

        // install default input map for the Button control
        behavior = new ButtonBehavior<>(control);
//        control.setInputMap(behavior.getInputMap());

        // Register listeners
        registerChangeListener(control.defaultButtonProperty(), o -> setDefaultButton(getSkinnable().isDefaultButton()));
        registerChangeListener(control.cancelButtonProperty(), o -> setCancelButton(getSkinnable().isCancelButton()));
        registerChangeListener(control.focusedProperty(), o -> {
            if (!getSkinnable().isFocused()) {
                ContextMenu cm = getSkinnable().getContextMenu();
                if (cm != null) {
                    if (cm.isShowing()) {
                        cm.hide();
                        Utils.removeMnemonics(cm, getSkinnable().getScene());
                    }
                }
            }
        });
        registerChangeListener(control.parentProperty(), o -> {
            if (getSkinnable().getParent() == null && getSkinnable().getScene() != null) {
                if (getSkinnable().isDefaultButton()) {
                    getSkinnable().getScene().getAccelerators().remove(defaultAcceleratorKeyCodeCombination);
                }
                if (getSkinnable().isCancelButton()) {
                    getSkinnable().getScene().getAccelerators().remove(cancelAcceleratorKeyCodeCombination);
                }
            }
        });
        control.sceneProperty().addListener(weakSceneChangeListener);

        // set visuals
        if (getSkinnable().isDefaultButton()) {
            /*
            ** were we already the defaultButton, before the listener was added?
            ** don't laugh, it can happen....
            */
            setDefaultButton(true);
        }

        if (getSkinnable().isCancelButton()) {
            /*
            ** were we already the defaultButton, before the listener was added?
            ** don't laugh, it can happen....
            */
            setCancelButton(true);
        }
    }



    /* *************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /** {@inheritDoc} */
    @Override public void dispose() {
        if (getSkinnable() == null) return;
        if (getSkinnable().isDefaultButton()) {
            setDefaultButton(false);
        }
        if (getSkinnable().isCancelButton()) {
            setCancelButton(false);
        }
        getSkinnable().sceneProperty().removeListener(weakSceneChangeListener);
        super.dispose();

        if (behavior != null) {
            behavior.dispose();
        }
    }



    /* *************************************************************************
     *                                                                         *
     * Private implementation                                                  *
     *                                                                         *
     **************************************************************************/

    private void setDefaultButton(boolean isDefault) {
        setDefaultButton(getSkinnable().getScene(), isDefault);
    }

    private void setDefaultButton(Scene scene, boolean isDefault) {
        if (scene != null) {
            KeyCode acceleratorCode = KeyCode.ENTER;
            defaultAcceleratorKeyCodeCombination = new KeyCodeCombination(acceleratorCode);

            Runnable oldDefault = scene.getAccelerators().get(defaultAcceleratorKeyCodeCombination);
            if (!isDefault) {
                /**
                 * first check of there's a default button already
                 */
                if (defaultButtonRunnable.equals(oldDefault)) {
                    /**
                     * is it us?
                     */
                    scene.getAccelerators().remove(defaultAcceleratorKeyCodeCombination);
                }
            }
            else {
                if (!defaultButtonRunnable.equals(oldDefault)) {
                    scene.getAccelerators().remove(defaultAcceleratorKeyCodeCombination);
                    scene.getAccelerators().put(defaultAcceleratorKeyCodeCombination, defaultButtonRunnable);
                }
            }
        }
    }

    private void setCancelButton(boolean isCancel) {
        setCancelButton(getSkinnable().getScene(), isCancel);
    }

    private void setCancelButton(Scene scene, boolean isCancel) {
        if (scene != null) {
            KeyCode acceleratorCode = KeyCode.ESCAPE;
            cancelAcceleratorKeyCodeCombination = new KeyCodeCombination(acceleratorCode);

            Runnable oldCancel = scene.getAccelerators().get(cancelAcceleratorKeyCodeCombination);
            if (!isCancel) {
                /**
                 * first check of there's a cancel button already
                 */
                if (cancelButtonRunnable.equals(oldCancel)) {
                    /**
                     * is it us?
                     */
                    scene.getAccelerators().remove(cancelAcceleratorKeyCodeCombination);
                }
            }
            else {
                if (!cancelButtonRunnable.equals(oldCancel)) {
                    scene.getAccelerators().remove(cancelAcceleratorKeyCodeCombination);
                    scene.getAccelerators().put(cancelAcceleratorKeyCodeCombination, cancelButtonRunnable);
                }
            }
        }
    }
}
