---
authority_type: "reference_implementation"
category: "01-openjfx-source"
file_type: "code"
license: "GPL-2.0-only with Classpath Exception"
normalized_at: "2026-05-10T17:08:14.655054+00:00"
normalizer: "jmkc_normalizer@0.1.0"
raw_sha256: "4bf866bf797ef056653dc39cd073f89724444fa8b85ba07583117512752fa5b2"
retrieved_at: "2026-05-10T17:04:00.671124+00:00"
source_commit: "277aec13d0879718a9ac2231402e19eed6f70d20"
source_id: "openjdk-jfx"
source_name: "OpenJFX Source"
source_path: "git/modules/javafx.controls/src/main/java/javafx/scene/control/skin/HyperlinkSkin.java"
source_repo: "https://github.com/openjdk/jfx.git"
source_url: "https://github.com/openjdk/jfx.git/blob/277aec13d0879718a9ac2231402e19eed6f70d20/modules/javafx.controls/src/main/java/javafx/scene/control/skin/HyperlinkSkin.java"
title: "HyperlinkSkin.java"
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
```
