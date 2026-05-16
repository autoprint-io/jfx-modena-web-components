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
