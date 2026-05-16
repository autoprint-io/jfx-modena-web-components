---
authority_type: "reference_implementation"
category: "01-openjfx-source"
file_type: "code"
license: "GPL-2.0-only with Classpath Exception"
normalized_at: "2026-05-10T17:08:14.691784+00:00"
normalizer: "jmkc_normalizer@0.1.0"
raw_sha256: "af5a90ef8b53784c546f14571ea1044240ab043711bd35aacb66b309af655404"
retrieved_at: "2026-05-10T17:04:00.671124+00:00"
source_commit: "277aec13d0879718a9ac2231402e19eed6f70d20"
source_id: "openjdk-jfx"
source_name: "OpenJFX Source"
source_path: "git/modules/javafx.controls/src/main/java/javafx/scene/control/skin/TooltipSkin.java"
source_repo: "https://github.com/openjdk/jfx.git"
source_url: "https://github.com/openjdk/jfx.git/blob/277aec13d0879718a9ac2231402e19eed6f70d20/modules/javafx.controls/src/main/java/javafx/scene/control/skin/TooltipSkin.java"
title: "TooltipSkin.java"
---
```java
/*
 * Copyright (c) 2011, 2024, Oracle and/or its affiliates. All rights reserved.
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

import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.control.Skin;
import javafx.scene.control.Tooltip;

/**
 * CSS based skin for Tooltip. It deals mostly with show hide logic for
 * Popup based controls, and specifically in this case for tooltip. It also
 * implements some of the Skin interface methods.
 *
 * TooltipContent class is the actual skin implementation of the tooltip.
 */
public class TooltipSkin implements Skin<Tooltip> {

    /* *************************************************************************
     *                                                                         *
     * Private fields                                                          *
     *                                                                         *
     **************************************************************************/

    private Label tipLabel;

    private Tooltip tooltip;



    /* *************************************************************************
     *                                                                         *
     * Constructors                                                            *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new TooltipSkin instance for the given {@link Tooltip}.
     * @param t the tooltip
     */
    public TooltipSkin(Tooltip t) {
        this.tooltip = t;
        tipLabel = new Label();
        tipLabel.contentDisplayProperty().bind(t.contentDisplayProperty());
        tipLabel.fontProperty().bind(t.fontProperty());
        tipLabel.graphicProperty().bind(t.graphicProperty());
        tipLabel.graphicTextGapProperty().bind(t.graphicTextGapProperty());
        tipLabel.textAlignmentProperty().bind(t.textAlignmentProperty());
        tipLabel.textOverrunProperty().bind(t.textOverrunProperty());
        tipLabel.textProperty().bind(t.textProperty());
        tipLabel.wrapTextProperty().bind(t.wrapTextProperty());
        tipLabel.minWidthProperty().bind(t.minWidthProperty());
        tipLabel.prefWidthProperty().bind(t.prefWidthProperty());
        tipLabel.maxWidthProperty().bind(t.maxWidthProperty());
        tipLabel.minHeightProperty().bind(t.minHeightProperty());
        tipLabel.prefHeightProperty().bind(t.prefHeightProperty());
        tipLabel.maxHeightProperty().bind(t.maxHeightProperty());

        // JDK-8109380 - skin needs to have styleClass of the control
        // TODO - This needs to be bound together, not just set! Probably should
        // do the same for id and style as well.
        tipLabel.getStyleClass().setAll(t.getStyleClass());
        tipLabel.setStyle(t.getStyle());
        tipLabel.setId(t.getId());
    }



    /* *************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /** {@inheritDoc} */
    @Override public Tooltip getSkinnable() {
        return tooltip;
    }

    /** {@inheritDoc} */
    @Override public Node getNode() {
        return tipLabel;
    }

    /** {@inheritDoc} */
    @Override public void dispose() {
        tooltip = null;
        tipLabel = null;
    }
}
```
