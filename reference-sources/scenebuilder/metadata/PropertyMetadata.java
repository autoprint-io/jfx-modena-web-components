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
