---
authority_type: "reference_implementation"
category: "01-openjfx-source"
file_type: "code"
license: "GPL-2.0-only with Classpath Exception"
normalized_at: "2026-05-10T17:08:14.563120+00:00"
normalizer: "jmkc_normalizer@0.1.0"
raw_sha256: "3371cb02f37f6cb8e5e8c0e87739bba5317c93f6e374081bfcbaefbeeb23d01b"
retrieved_at: "2026-05-10T17:04:00.671124+00:00"
source_commit: "277aec13d0879718a9ac2231402e19eed6f70d20"
source_id: "openjdk-jfx"
source_name: "OpenJFX Source"
source_path: "git/modules/javafx.controls/src/main/java/javafx/scene/control/ProgressBar.java"
source_repo: "https://github.com/openjdk/jfx.git"
source_url: "https://github.com/openjdk/jfx.git/blob/277aec13d0879718a9ac2231402e19eed6f70d20/modules/javafx.controls/src/main/java/javafx/scene/control/ProgressBar.java"
title: "ProgressBar.java"
---
```java
/*
 * Copyright (c) 2010, 2022, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Oracle designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Oracle in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */

package javafx.scene.control;

import javafx.scene.control.skin.ProgressBarSkin;

import javafx.css.StyleableProperty;
import javafx.scene.AccessibleAttribute;
import javafx.geometry.Orientation;

/**
 * A specialization of the ProgressIndicator which is represented as a
 * horizontal bar.
 * <p>
 * ProgressBar sets focusTraversable to false.
 * </p>
 *
 * <p>
 * This first example creates a ProgressBar with an indeterminate value:
 * <pre><code> ProgressBar p1 = new ProgressBar();</code></pre>
 *
 * <img src="doc-files/ProgressBar_indeterminate.png" alt="Image of the indeterminate progress ProgressBar control">
 *
 * <p>
 * This next example creates a ProgressBar which is 25% complete:
 * <pre><code> ProgressBar p2 = new ProgressBar();
 * p2.setProgress(0.25F);</code></pre>
 *
 * <img src="doc-files/ProgressBar.png" alt="Image of the ProgressBar control">
 *
 * @since JavaFX 2.0
 */
public class ProgressBar extends ProgressIndicator {


    /* *************************************************************************
     *                                                                         *
     * Constructors                                                            *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new indeterminate ProgressBar.
     */
    public ProgressBar() {
        this(INDETERMINATE_PROGRESS);
    }

    /**
     * Creates a new ProgressBar with the given progress value.
     * @param progress the progress, represented as a value between 0 and 1
     */
    public ProgressBar(double progress) {
        // focusTraversable is styleable through css. Calling setFocusTraversable
        // makes it look to css like the user set the value and css will not
        // override. Initializing focusTraversable by calling set on the
        // CssMetaData ensures that css will be able to override the value.
        ((StyleableProperty<Boolean>)focusTraversableProperty()).applyStyle(null, Boolean.FALSE);
        setProgress(progress);
        getStyleClass().setAll(DEFAULT_STYLE_CLASS);
    }

    /* *************************************************************************
     *                                                                         *
     * Methods                                                                 *
     *                                                                         *
     **************************************************************************/

    /** {@inheritDoc} */
    @Override protected Skin<?> createDefaultSkin() {
        return new ProgressBarSkin(this);
    }

    /* *************************************************************************
     *                                                                         *
     * Stylesheet Handling                                                     *
     *                                                                         *
     **************************************************************************/

    /**
     * Initialize the style class to 'progress-bar'.
     *
     * This is the selector class from which CSS can be used to style
     * this control.
     */
    private static final String DEFAULT_STYLE_CLASS = "progress-bar";

    /**
     * Returns the initial focus traversable state of this control, for use
     * by the JavaFX CSS engine to correctly set its initial value. This method
     * is overridden as by default UI controls have focus traversable set to true,
     * but that is not appropriate for this control.
     *
     * @since 9
     */
    @Override protected Boolean getInitialFocusTraversable() {
        return Boolean.FALSE;
    }


    /* *************************************************************************
     *                                                                         *
     * Accessibility handling                                                  *
     *                                                                         *
     **************************************************************************/

    /** {@inheritDoc} */
    @Override
    public Object queryAccessibleAttribute(AccessibleAttribute attribute, Object... parameters) {
        switch (attribute) {
            case ORIENTATION: return Orientation.HORIZONTAL;
            default: return super.queryAccessibleAttribute(attribute, parameters);
        }
    }
}
```
