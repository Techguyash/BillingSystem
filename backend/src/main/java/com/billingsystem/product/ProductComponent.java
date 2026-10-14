package com.billingsystem.product;

import com.billingsystem.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/** One line of a composite/bundle product's recipe — "1x bundle contains `quantity` of `componentProduct`". */
@Entity
@Table(name = "product_components")
@Getter
@Setter
public class ProductComponent extends BaseEntity {

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "bundle_product_id", nullable = false)
  private Product bundleProduct;

  @Column(name = "component_product_id", nullable = false)
  private UUID componentProductId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "component_product_id", insertable = false, updatable = false)
  private Product componentProduct;

  /** Snapshot so the recipe still reads sensibly even if the component is later renamed. */
  @Column(name = "component_product_name", nullable = false)
  private String componentProductName;

  @Column(precision = 12, scale = 3, nullable = false)
  private BigDecimal quantity;
}
