---
authority_type: "reference_implementation"
category: "03-fxml-scene-builder"
file_type: "code"
license: "BSD-3-Clause"
normalized_at: "2026-05-10T17:08:09.749016+00:00"
normalizer: "jmkc_normalizer@0.1.0"
raw_sha256: "1d8d0d42a3039f143f2f505f39b3950e27ddeb5b77eba1d7a194746880ee0150"
retrieved_at: "2026-05-10T17:05:17.957053+00:00"
source_commit: "f3194d6f8089789549c105f112f3bc6836eec55a"
source_id: "gluon-scenebuilder"
source_name: "Gluon Scene Builder Source"
source_path: "git/kit/src/main/java/com/oracle/javafx/scenebuilder/kit/metadata/klass/ClassMetadata.java"
source_repo: "https://github.com/gluonhq/scenebuilder.git"
source_url: "https://github.com/gluonhq/scenebuilder.git/blob/f3194d6f8089789549c105f112f3bc6836eec55a/kit/src/main/java/com/oracle/javafx/scenebuilder/kit/metadata/klass/ClassMetadata.java"
title: "ClassMetadata.java"
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
package com.oracle.javafx.scenebuilder.kit.metadata.klass;

import java.util.Objects;

/**
 *
 * 
 */
public class ClassMetadata implements Comparable<ClassMetadata> {
    
    private final Class<?> klass;

    public ClassMetadata(Class<?> klass) {
        this.klass = klass;
    }

    public Class<?> getKlass() {
        return klass;
    }
    
    /*
     * Object
     */
    
    @Override
    public String toString() {
        return klass.getCanonicalName();
    }
    
    
    /*
     * Comparable
     */
    @Override
    public int compareTo(ClassMetadata o) {
        return this.klass.getCanonicalName().compareTo(o.klass.getCanonicalName());
    }

    /*
     * Object
     */
    @Override
    public int hashCode() {
        int hash = 5;
        hash = 19 * hash + Objects.hashCode(this.klass);
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
        final ClassMetadata other = (ClassMetadata) obj;
        if (!Objects.equals(this.klass, other.klass)) {
            return false;
        }
        return true;
    }
    
    
}
```
