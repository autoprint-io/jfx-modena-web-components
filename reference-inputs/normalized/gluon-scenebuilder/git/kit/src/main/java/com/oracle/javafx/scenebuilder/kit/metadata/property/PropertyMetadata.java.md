---
authority_type: "reference_implementation"
category: "03-fxml-scene-builder"
file_type: "code"
license: "BSD-3-Clause"
normalized_at: "2026-05-10T17:08:09.753282+00:00"
normalizer: "jmkc_normalizer@0.1.0"
raw_sha256: "36faccd22dafa917ef0e26e90d6bee78e1a561efb32c2b6d37db079548d77e3f"
retrieved_at: "2026-05-10T17:05:17.957053+00:00"
source_commit: "f3194d6f8089789549c105f112f3bc6836eec55a"
source_id: "gluon-scenebuilder"
source_name: "Gluon Scene Builder Source"
source_path: "git/kit/src/main/java/com/oracle/javafx/scenebuilder/kit/metadata/property/PropertyMetadata.java"
source_repo: "https://github.com/gluonhq/scenebuilder.git"
source_url: "https://github.com/gluonhq/scenebuilder.git/blob/f3194d6f8089789549c105f112f3bc6836eec55a/kit/src/main/java/com/oracle/javafx/scenebuilder/kit/metadata/property/PropertyMetadata.java"
title: "PropertyMetadata.java"
---
```java
/*
 * Copyright (c) 2012, 2014, Oracle and/or its affiliates.
 * All rights reserved. Use is subject to license terms.
 *
 * This file is available and licensed under the following license:
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *  - Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  - Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the distribution.
 *  - Neither the name of Oracle Corporation nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package com.oracle.javafx.scenebuilder.kit.metadata.property;

import com.oracle.javafx.scenebuilder.kit.metadata.util.PropertyName;
import java.util.Objects;

/**
 *
 * 
 */
public class PropertyMetadata implements Comparable<PropertyMetadata> {
    
    private final PropertyName name;

    public PropertyMetadata(PropertyName name) {
        this.name = name;
    }

    public PropertyName getName() {
        return name;
    }
    
    
    /*
     * Comparable
     */
    @Override
    public int compareTo(PropertyMetadata o) {
        return this.name.compareTo(o.name);
    }

    /*
     * Object
     */
    
    @Override
    public int hashCode() {
        int hash = 5;
        hash = 37 * hash + Objects.hashCode(this.name);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final PropertyMetadata other = (PropertyMetadata) obj;
        if (!Objects.equals(this.name, other.name)) {
            return false;
        }
        return true;
    }
    
}
```
