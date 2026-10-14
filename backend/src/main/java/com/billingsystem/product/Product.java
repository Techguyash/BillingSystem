package com.billingsystem.product;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  private String sku;

  private String barcode;

  @Column(name = "hsn_code")
  private String hsnCode;

  @Column(nullable = false)
  private String unit = "pcs";

  @Column(name = "cost_price", precision = 12, scale = 2, nullable = false)
  private BigDecimal costPrice = BigDecimal.ZERO;

  @Column(name = "selling_price", precision = 12, scale = 2, nullable = false)
  private BigDecimal sellingPrice = BigDecimal.ZERO;

  @Column(name = "tax_rate_percent", precision = 5, scale = 2, nullable = false)
  private BigDecimal taxRatePercent = BigDecimal.ZERO;

  @Column(name = "stock_qty", precision = 12, scale = 2, nullable = false)
  private BigDecimal stockQty = BigDecimal.ZERO;

  @Column(name = "reorder_level", precision = 12, scale = 2, nullable = false)
  private BigDecimal reorderLevel = BigDecimal.ZERO;

  // Lombok's getter for a boolean field named "isActive" is isActive(), but
  // Jackson's default bean-naming strips the "is" prefix from boolean
  // getters, inferring the property name "active". If we just slap
  // @JsonProperty("isActive") on the field, Jackson ends up emitting BOTH
  // "active" (from the getter) and "isActive" (from the annotated field) in
  // the JSON. Suppressing the Lombok getter and writing it by hand with the
  // annotation avoids the duplicate entirely.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @JsonProperty("isActive")
  public boolean isActive() {
    return isActive;
  }

  /**
   * A "virtual" SKU made up of other products (e.g. a gift hamper of
   * several items sold as one line). Composite products don't carry their
   * own stock — selling/returning/voiding one adjusts each component's
   * stock instead (see InvoiceService/CreditNoteService).
   */
  @Getter(AccessLevel.NONE)
  @Column(name = "is_composite", nullable = false)
  private boolean isComposite = false;

  @JsonProperty("isComposite")
  public boolean isComposite() {
    return isComposite;
  }

  @OneToMany(mappedBy = "bundleProduct", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<ProductComponent> components = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "custom_fields", columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> customFields = new HashMap<>();
}
