package com.oracle.javafx.scenebuilder.kit.metadata.klass;

import com.oracle.javafx.scenebuilder.kit.metadata.ExternalMetadataProvider;
import com.oracle.javafx.scenebuilder.kit.metadata.property.PropertyMetadata;
import com.oracle.javafx.scenebuilder.kit.metadata.util.PropertyName;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.ServiceLoader;
import java.util.Set;

/**
 *
 * 
 */
public class ComponentClassMetadata extends ClassMetadata {
    
    private final Set<PropertyMetadata> properties = new HashSet<>();
    private final boolean freeChildPositioning;
    private final ComponentClassMetadata parentMetadata;

    public ComponentClassMetadata(Class<?> klass, ComponentClassMetadata parentMetadata) {
        super(klass);
        this.parentMetadata = parentMetadata;
        this.freeChildPositioning = false; // TODO(elp)
    }

    public Set<PropertyMetadata> getProperties() {
        return properties;
    }

    public PropertyName getSubComponentProperty() {
        PropertyName result = null;
        Class<?> componentClass = getKlass();
        
        if (componentClass == javafx.scene.layout.BorderPane.class) {
            // We consider that BorderPane has no subcomponents.
            // left, right, bottom and top components are treated as "accessories".
            result = null;
        } else if (componentClass == javafx.scene.control.DialogPane.class) {
            // We consider that DialogPane has no subcomponents.
            // content, expanded content, header and graphic components are treated as "accessories".
            result = null;
        } else {
            while ((result == null) && (componentClass != null)) {
                result = getSubComponentProperty(componentClass);
                componentClass = componentClass.getSuperclass();
            }
        }

        return result;
    }

    public boolean isFreeChildPositioning() {
        return freeChildPositioning;
    }

    public ComponentClassMetadata getParentMetadata() {
        return parentMetadata;
    }
    
    public PropertyMetadata lookupProperty(PropertyName propertyName) {
        PropertyMetadata result = null;
        
        assert propertyName != null;
        
        final Iterator<PropertyMetadata> it = properties.iterator();
        while ((result == null) && it.hasNext()) {
            final PropertyMetadata pm = it.next();
            if (pm.getName().equals(propertyName)) {
                result = pm;
            }
        }
        
        return result;
    }

    /*
     * Object
     */
    
    @Override
    public int hashCode() {
        return super.hashCode(); // Only to please FindBugs
    }

    @Override
    public boolean equals(Object obj) {
        return super.equals(obj); // Only to please FindBugs
    }
    
    
    /*
     * Private
     */
    
    private static PropertyName getSubComponentProperty(Class<?> componentClass) {
        final PropertyName result;
        
        assert componentClass != javafx.scene.layout.BorderPane.class
                && componentClass != javafx.scene.control.DialogPane.class;
        
        /*
         * Component Class -> Sub Component Property
         * =========================================
         * 
         * Accordion                    panes
         * ButtonBar                    buttons
         * ContextMenu                  items
         * Menu                         items
         * MenuBar                      menus
         * MenuButton                   items
         * Path                         elements
         * SplitPane                    items
         * SplitMenuButton              items
         * TableColumn                  columns
         * TableView                    columns
         * TabPane                      tabs
         * ToolBar                      items
         * TreeTableColumn              columns
         * TreeTableView                columns
         * 
         * Group                        children
         * Panes                        children
         *
         * ------------------------------------
         *
         * Other            null
         */
      
        if (componentClass == javafx.scene.control.Accordion.class) {
            result = panesName;
        } else if (componentClass == javafx.scene.control.ButtonBar.class) {
            result = buttonsName;
        } else if (componentClass == javafx.scene.control.ContextMenu.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.control.Menu.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.control.MenuBar.class) {
            result = menusName;
        } else if (componentClass == javafx.scene.control.MenuButton.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.shape.Path.class) {
            result = elementsName;
        } else if (componentClass == javafx.scene.control.SplitMenuButton.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.control.SplitPane.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.control.TableColumn.class) {
            result = columnsName;
        } else if (componentClass == javafx.scene.control.TableView.class) {
            result = columnsName;
        } else if (componentClass == javafx.scene.control.TabPane.class) {
            result = tabsName;
        } else if (componentClass == javafx.scene.control.ToolBar.class) {
            result = itemsName;
        } else if (componentClass == javafx.scene.control.TreeTableColumn.class) {
            result = columnsName;
        } else if (componentClass == javafx.scene.control.TreeTableView.class) {
            result = columnsName;
        } else if (componentClass == javafx.scene.Group.class) {
            result = childrenName;
        } else if (componentClass == javafx.scene.layout.Pane.class) {
            result = childrenName;
        } else {
            result = getExternalSubComponentProperty(componentClass)
                .orElse(null);
        }
        return result;
    }
        
    private static final PropertyName buttonsName = new PropertyName("buttons");
    private static final PropertyName columnsName = new PropertyName("columns");
    private static final PropertyName elementsName = new PropertyName("elements");
    private static final PropertyName itemsName = new PropertyName("items");
    private static final PropertyName menusName = new PropertyName("menus");
    private static final PropertyName panesName = new PropertyName("panes");
    private static final PropertyName tabsName = new PropertyName("tabs");
    private static final PropertyName childrenName = new PropertyName("children");

    private static final Collection<ExternalMetadataProvider> externalMetadataProviders = getExternalMetadataProviders();

    private static Optional<PropertyName> getExternalSubComponentProperty(Class<?> componentClass) {
        for (ExternalMetadataProvider provider : externalMetadataProviders) {
            Optional<PropertyName> externalSubComponentProperty = provider.getExternalSubComponentProperty(componentClass);
            if (externalSubComponentProperty.isPresent()) {
                return externalSubComponentProperty;
            }
        }
        return Optional.empty();
    }

    private static Collection<ExternalMetadataProvider> getExternalMetadataProviders() {
        ServiceLoader<ExternalMetadataProvider> loader = ServiceLoader.load(ExternalMetadataProvider.class);
        Collection<ExternalMetadataProvider> providers = new ArrayList<>();
        loader.iterator().forEachRemaining(providers::add);
        return providers;
    }
}
